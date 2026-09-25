import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import { getSettings, regenerate } from '@/lib/commissionRules'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Admin: save the inputs the automatic lines are derived from, then
 * recalculate. A change produces a draft for review; nothing is published.
 * Body: { salesShare, referralShare, renewalFactor } as fractions, { odooLevel }.
 */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : NaN)
  const sales = num(body.salesShare), referral = num(body.referralShare), factor = num(body.renewalFactor)
  const level = String(body.odooLevel || '')
  if (!(sales > 0 && sales <= 0.8)) return NextResponse.json({ error: 'The Sales Partner share must be between 0% and 80% of your margin.' }, { status: 400 })
  if (!(referral > 0 && referral <= sales)) return NextResponse.json({ error: 'The Referral Partner share must be above 0% and no more than the Sales Partner share.' }, { status: 400 })
  if (!(factor > 0 && factor <= 1)) return NextResponse.json({ error: 'The renewal rate must be between 0% and 100% of the first-year rate.' }, { status: 400 })
  if (!['none', 'ready', 'silver', 'gold'].includes(level)) return NextResponse.json({ error: 'Unknown Odoo level.' }, { status: 400 })

  await connectDB()
  const s = await getSettings()
  const levelChanged = s.odooLevel !== level
  s.salesShare = sales; s.referralShare = referral; s.renewalFactor = factor
  s.odooLevel = level as typeof s.odooLevel
  s.updatedBy = auth.email || auth.name || 'admin'
  await s.save()
  const r = await regenerate(levelChanged ? `Odoo partnership level set to ${level}` : 'Commission settings change', s.updatedBy || 'admin')
  return NextResponse.json({ ok: true, ...r })
}
