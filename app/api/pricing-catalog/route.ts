import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { PricingCatalog } from '@/models/PricingCatalog'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    const customerType = searchParams.get('customerType')
    const billingPlan = searchParams.get('billingPlan')
    const solutionArea = searchParams.get('solutionArea')
    const skuTitlesParam = searchParams.get('skuTitles')
    const distinct = searchParams.get('distinct')
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 500)

    if (distinct === 'solutionArea') {
      const areas = await PricingCatalog.distinct('solutionArea', { active: true })
      return NextResponse.json({ success: true, solutionAreas: areas.filter(Boolean).sort() })
    }

    const filter: Record<string, unknown> = { active: true }
    if (customerType) filter.customerType = customerType
    if (billingPlan) filter.billingPlan = billingPlan
    if (solutionArea) filter.solutionArea = solutionArea
    if (q) filter.skuTitle = { $regex: q, $options: 'i' }
    // Exact-match lookup for a known set of SKUs (e.g. the Proposal Generator
    // pulling every term/billing-plan combination for a package's products).
    if (skuTitlesParam) filter.skuTitle = { $in: skuTitlesParam.split(',').map((s) => s.trim()) }

    const [items, total, lastImport] = await Promise.all([
      PricingCatalog.find(filter).sort({ skuTitle: 1, billingPlan: 1 }).limit(limit),
      PricingCatalog.countDocuments(filter),
      PricingCatalog.findOne({ active: true }).sort({ updatedAt: -1 }).select('importBatch sourceFile updatedAt'),
    ])

    return NextResponse.json({
      success: true,
      items,
      total,
      lastImport: lastImport
        ? { batch: lastImport.importBatch, sourceFile: lastImport.sourceFile, at: lastImport.updatedAt }
        : null,
    })
  } catch (err) {
    console.error('GET /api/pricing-catalog failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch pricing catalog' }, { status: 500 })
  }
}

// Manual single-SKU add — for ISV/OEM products that don't come through the
// distributor's NCE pricelist (e.g. items from the Security/HR/e-Learning tabs).
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDB()
    const body = await req.json()
    const retailUSD = Number(body.retailUSD) || 0
    const resellerUSD = Number(body.resellerUSD) || 0
    const marginUSD = retailUSD - resellerUSD
    const item = await PricingCatalog.create({
      ...body,
      marginUSD,
      marginPercent: retailUSD > 0 ? marginUSD / retailUSD : 0,
      importBatch: body.importBatch || 'manual',
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (err) {
    console.error('POST /api/pricing-catalog failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to create catalog item' }, { status: 500 })
  }
}
