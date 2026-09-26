import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import DealRegistration from '@/models/DealRegistration'
import PartnerCommission from '@/models/PartnerCommission'
import { versionRows, evaluatePayment, recordPartnerPayment, type PaymentInput } from '@/lib/partnerCommissionLedger'

export const dynamic = 'force-dynamic'

/**
 * Admin. GET ?deal=<id>: the deal's commission lines, plus the schedule rows
 * available for a first-year payment (its locked version) and a renewal (the
 * current version). GET with no deal: every line, newest first.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  await connectDB()
  const dealId = req.nextUrl.searchParams.get('deal')
  if (!dealId) {
    const entries = await PartnerCommission.find({}).sort({ receivedAt: -1 }).lean()
    return NextResponse.json({ entries })
  }
  if (!mongoose.isValidObjectId(dealId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const deal = await DealRegistration.findById(dealId)
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [entries, firstYear, renewal] = await Promise.all([
    PartnerCommission.find({ deal: deal._id }).sort({ receivedAt: -1 }).lean(),
    versionRows(deal.scheduleVersion), versionRows(null),
  ])
  return NextResponse.json({ entries, firstYear, renewal, category: deal.category })
}

/** Admin: preview ({ preview: true }) or record a payment received. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  let body: PaymentInput & { preview?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  if (!mongoose.isValidObjectId(body.dealId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await connectDB()
  if (body.preview) {
    const e = await evaluatePayment(body)
    return NextResponse.json(e, { status: e.ok ? 200 : 400 })
  }
  const r = await recordPartnerPayment(body, auth.email || auth.name || 'admin', 'manual')
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ ok: true, entry: r.entry })
}
