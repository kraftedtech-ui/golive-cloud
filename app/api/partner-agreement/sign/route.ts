import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import PartnerApplication from '@/models/PartnerApplication'
import { verifyPartnerToken } from '@/lib/partnerToken'
import { sendPartnerSignedNotice, AGREEMENT_LINK_DAYS } from '@/lib/partnerAgreementFlow'

export const dynamic = 'force-dynamic'

/** Partner (signed link): sign the agreement by typing their full name. */
export async function POST(req: NextRequest) {
  let body: { token?: string; typedName?: string } = {}
  try { body = await req.json() } catch { /* fallthrough */ }
  const v = verifyPartnerToken('pagree', String(body.token || ''))
  if (!v) return NextResponse.json({ error: 'This link is not valid or has expired.' }, { status: 401 })

  const typedName = String(body.typedName || '').trim().replace(/\s+/g, ' ')
  await connectDB()
  const app = await PartnerApplication.findOne({ ref: v.ref })
  if (!app || !app.agreement?.sentAt || ['declined', 'withdrawn'].includes(app.status)) {
    return NextResponse.json({ error: 'No agreement is waiting for this link.' }, { status: 404 })
  }
  if (app.agreement.partnerSignedAt) return NextResponse.json({ error: 'This agreement has already been signed.' }, { status: 409 })
  if (Date.now() - new Date(app.agreement.sentAt).getTime() > AGREEMENT_LINK_DAYS * 864e5) {
    return NextResponse.json({ error: 'This agreement has lapsed. Please ask for it to be sent again.' }, { status: 410 })
  }
  if (typedName.toLowerCase() !== app.applicant.name.trim().replace(/\s+/g, ' ').toLowerCase()) {
    return NextResponse.json({ error: `Type your full name exactly as on your application: ${app.applicant.name.trim()}` }, { status: 400 })
  }

  const ip = (req.headers.get('cf-connecting-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0] || req.headers.get('x-real-ip') || 'unknown').trim()
  const now = new Date()
  app.agreement.partnerSignedAt = now
  app.agreement.partnerSignedName = typedName
  app.agreement.partnerIp = ip
  app.agreement.partnerUserAgent = req.headers.get('user-agent')?.slice(0, 300) || undefined
  app.markModified('agreement')
  app.timeline.push({ at: now, by: app.applicant.email, action: `${app.agreement.test ? 'TEST agreement' : 'Agreement'} signed by the partner as \u201c${typedName}\u201d`, note: `IP ${ip}` })
  await app.save()

  sendPartnerSignedNotice(app).then((r) => { if (!r.ok) console.error('[partner-agreement] signed notice failed:', r.error) })
  return NextResponse.json({ ok: true })
}
