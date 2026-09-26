import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import DealRegistration from '@/models/DealRegistration'
import PartnerCommission from '@/models/PartnerCommission'
import { SalesDocument } from '@/models/SalesDocument'
import { normaliseOrg } from '@/lib/partners'

export const dynamic = 'force-dynamic'

/**
 * Admin: accepted portal invoices a payment on this deal can be filled from.
 * Matching buyers first. Amount is the net total in naira (VAT excluded);
 * margin comes from the gross profit snapshotted on the invoice at acceptance.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const id = req.nextUrl.searchParams.get('deal') || ''
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await connectDB()
  const deal = await DealRegistration.findById(id).select('organisation')
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  type Doc = { invoiceNumber?: string; buyerName: string; acceptedAt?: Date; currency: string; netTotal: number; fxRateToNGN?: number; grossProfitUSD?: number }
  const docs = (await SalesDocument.find({ outcome: 'accepted', invoiceNumber: { $exists: true } })
    .select('invoiceNumber buyerName acceptedAt currency netTotal fxRateToNGN grossProfitUSD').sort({ acceptedAt: -1 }).limit(200).lean()) as unknown as Doc[]
  const used = new Set((await PartnerCommission.distinct('invoiceReference')) as string[])
  const org = normaliseOrg(deal.organisation)
  const out = docs.map((d) => {
    const cur = (d.currency || 'NGN').toUpperCase()
    const fx = d.fxRateToNGN || null
    const amountNGN = cur === 'NGN' ? d.netTotal : fx ? d.netTotal * fx : null
    const netUSD = cur === 'USD' ? d.netTotal : fx ? d.netTotal / fx : null
    const margin = typeof d.grossProfitUSD === 'number' && netUSD ? d.grossProfitUSD / netUSD : null
    const b = normaliseOrg(d.buyerName)
    return {
      invoiceNumber: d.invoiceNumber, buyerName: d.buyerName, acceptedAt: d.acceptedAt, currency: cur, netTotal: d.netTotal,
      amountNGN: amountNGN === null ? null : Math.round(amountNGN * 100) / 100, margin: margin === null ? null : Math.round(margin * 10000) / 10000,
      matches: !!org && !!b && (b === org || b.includes(org) || org.includes(b)), used: used.has(String(d.invoiceNumber)),
    }
  }).sort((a, b) => Number(b.matches) - Number(a.matches))
  return NextResponse.json({ invoices: out })
}
