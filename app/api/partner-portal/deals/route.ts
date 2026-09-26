import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { currentPartner } from '@/lib/partnerSession'
import DealRegistration from '@/models/DealRegistration'
import { nextDealRef, dealConflict, notifyNewRegistration } from '@/lib/dealRegistration'
import { normaliseOrg } from '@/lib/partners'

export const dynamic = 'force-dynamic'

const s = (n: number) => z.string().trim().max(n).optional().default('')
const Body = z.object({
  organisation: z.string().trim().min(2).max(160),
  sector: s(80), contactName: s(100), contactRole: s(100), contactEmail: s(160), contactPhone: s(40),
  lineOfBusiness: s(160), requirement: s(600), expectedClose: s(60),
  estimatedValue: z.number().min(0).max(1e13).optional(),
})

/**
 * Partner (session): register a prospect. It waits for the MD's approval;
 * the conflict check runs now so the MD sees it straight away.
 */
export async function POST(req: NextRequest) {
  const app = await currentPartner()
  if (!app) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  const p = Body.safeParse(raw)
  if (!p.success) return NextResponse.json({ error: 'Enter at least the organisation name, and check the other fields.' }, { status: 400 })
  const d = p.data

  const mine = await DealRegistration.find({ partnerApplication: app._id, status: { $in: ['pending', 'active'] } }).select('organisation status').lean() as unknown as { organisation: string; status: string }[]
  if (mine.some((m) => normaliseOrg(m.organisation) === normaliseOrg(d.organisation))) {
    return NextResponse.json({ error: `You already have ${d.organisation} registered or awaiting approval.` }, { status: 409 })
  }
  if (mine.filter((m) => m.status === 'pending').length >= 20) {
    return NextResponse.json({ error: 'You have 20 registrations awaiting approval. Please wait for those to be reviewed.' }, { status: 429 })
  }

  const now = new Date()
  const deal = await DealRegistration.create({
    ref: await nextDealRef(now), partnerApplication: app._id, partnerNumber: app.partnerNumber, partnerName: app.applicant.name,
    partnerEmail: app.applicant.email, category: app.category, source: 'portal', ...d,
    status: 'pending', conflict: await dealConflict(d.organisation, app.partnerNumber!), submittedAt: now, milestones: [],
    timeline: [{ at: now, by: app.applicant.email, action: 'Registered by the partner' }],
  })
  notifyNewRegistration(deal)
  return NextResponse.json({ ok: true, ref: deal.ref })
}
