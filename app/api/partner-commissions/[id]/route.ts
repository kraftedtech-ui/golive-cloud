import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import PartnerCommission from '@/models/PartnerCommission'
import DealRegistration from '@/models/DealRegistration'

export const dynamic = 'force-dynamic'

/**
 * Admin actions on a commission line:
 *   paid { paidAt, reference }   GoLive has paid the partner
 *   clawback { reason }          client cancelled, refunded or defaulted within 90 days of payment (clause 5.3)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  await connectDB()
  const c = await PartnerCommission.findById(id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const by = auth.email || auth.name || 'admin'
  const now = new Date()
  let action = ''
  if (body.action === 'paid') {
    if (c.status !== 'accrued') return NextResponse.json({ error: 'Only an accrued line can be marked paid.' }, { status: 409 })
    const paidAt = body.paidAt ? new Date(String(body.paidAt)) : now
    const ref = String(body.reference || '').trim()
    if (isNaN(paidAt.getTime())) return NextResponse.json({ error: 'Enter the payment date.' }, { status: 400 })
    if (!ref) return NextResponse.json({ error: 'Enter the payment reference (bank transfer or voucher).' }, { status: 400 })
    c.status = 'paid'; c.paidAt = paidAt; c.paymentReference = ref
    action = `Commission ${c.ref} paid (\u20a6${c.net.toLocaleString('en-NG')}), reference ${ref}`
  } else if (body.action === 'clawback') {
    if (c.status === 'clawed_back') return NextResponse.json({ error: 'Already clawed back.' }, { status: 409 })
    const reason = String(body.reason || '').trim()
    if (!reason) return NextResponse.json({ error: 'Give the reason: cancellation, refund or default.' }, { status: 400 })
    if (now.getTime() > new Date(c.clawbackUntil).getTime()) return NextResponse.json({ error: `The 90-day recovery window ended on ${new Date(c.clawbackUntil).toISOString().slice(0, 10)} (clause 5.3).` }, { status: 409 })
    c.status = 'clawed_back'; c.clawbackReason = reason; c.clawedBackAt = now
    action = `Commission ${c.ref} clawed back (\u20a6${c.net.toLocaleString('en-NG')}${c.paidAt ? ', already paid: recover by deduction or repayment' : ''})`
  } else return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  await c.save()
  await DealRegistration.updateOne({ _id: c.deal }, { $push: { timeline: { at: now, by, action, note: body.action === 'clawback' ? String(body.reason) : undefined } } })
  return NextResponse.json({ entry: c.toObject() })
}
