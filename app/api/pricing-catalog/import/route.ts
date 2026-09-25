import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { PricingCatalog } from '@/models/PricingCatalog'
import { requireAdmin } from '@/lib/apiAuth'
import { parsePricelistWorkbook } from '@/lib/pricelistParser'

export const dynamic = 'force-dynamic'

function defaultBatch() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded. Attach the distributor pricelist .xlsx.' }, { status: 400 })
    }

    const distributor = String(formData.get('distributor') || '4Sight Dynamics Africa')
    const batch = String(formData.get('batch') || defaultBatch())
    const buffer = Buffer.from(await file.arrayBuffer())

    const { rows, warnings, sheetCounts } = parsePricelistWorkbook(buffer, distributor)
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No priced rows found in file.', warnings }, { status: 400 })
    }

    await connectDB()

    // Upsert in chunks to keep individual bulkWrite payloads reasonable.
    const CHUNK = 500
    let created = 0
    let updated = 0
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      const ops = chunk.map((row) => ({
        updateOne: {
          filter: {
            productId: row.productId,
            skuTitle: row.skuTitle,
            termDuration: row.termDuration,
            billingPlan: row.billingPlan,
            customerType: row.customerType,
          },
          update: { $set: { ...row, active: true, importBatch: batch, sourceFile: file.name } },
          upsert: true,
        },
      }))
      const result = await PricingCatalog.bulkWrite(ops, { ordered: false })
      created += result.upsertedCount || 0
      updated += result.modifiedCount || 0
    }

    // Anything from this distributor not touched by this import is now stale
    // (dropped SKU, renamed term, etc.) — deactivate but keep for historical
    // proposals/commissions rather than deleting.
    const deactivated = await PricingCatalog.updateMany(
      { distributor, active: true, importBatch: { $ne: batch } },
      { $set: { active: false } }
    )

    const total = await PricingCatalog.countDocuments({ distributor, active: true })

    // Partner commission: a new price list may change GoLive's Microsoft
    // margins, so recalculate the automatic commission lines. Any change
    // becomes a draft for the MD to review; nothing is published here, and a
    // failure never affects the import itself.
    let commission: { changed: boolean; draftUpdated: boolean; message: string } | { error: string } | null = null
    try {
      const { regenerate } = await import('@/lib/commissionRules')
      const r = await regenerate(`Pricing catalogue import ${batch}`, auth.email || auth.name || 'admin')
      commission = { changed: r.changed, draftUpdated: r.draftUpdated, message: r.message }
    } catch (e) {
      console.error('[pricing-catalog] commission recalculation failed:', e)
      commission = { error: 'Commission rates could not be recalculated automatically. Use Recalculate on the Commission schedule page.' }
    }

    return NextResponse.json({
      success: true,
      batch,
      parsedRows: rows.length,
      created,
      updated,
      deactivated: deactivated.modifiedCount || 0,
      activeTotal: total,
      sheetCounts,
      warnings,
      commission,
    })
  } catch (err) {
    console.error('POST /api/pricing-catalog/import failed:', err)
    return NextResponse.json({ success: false, error: 'Import failed — check the file format and try again.' }, { status: 500 })
  }
}
