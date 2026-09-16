import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { verifyOnboardingToken } from '@/lib/onboardingToken'
import { sendOnboardingAckNotice } from '@/lib/onboardingEmail'

export const dynamic = 'force-dynamic'

// Public, token-authenticated: the hire acknowledges each document separately,
// consents to BCI screening, and signs with their typed legal name.
//
// Per-document timestamps are recorded so the audit trail reflects what was
// read and when, rather than one blanket acceptance.
export async function POST(req: NextRequest) {
  let body: { token?: string; typedName?: string; bciConsent?: boolean; documents?: string[] } = {}
  try { body = await req.json() } catch { /* fallthrough */ }

  const v = verifyOnboardingToken(String(body.token || ''))
  if (!v) return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 401 })

  const typedName = String(body.typedName || '').trim().replace(/\s+/g, ' ')
  if (typedName.length < 5 || !typedName.includes(' ') || typedName.length > 100) {
    return NextResponse.json({ error: 'Please type your full legal name.' }, { status: 400 })
  }
  if (body.bciConsent !== true) {
    return NextResponse.json({ error: 'Background-check consent is required to complete onboarding.' }, { status: 400 })
  }

  await connectDB()
  const app = await Application.findOne({ ref: v.ref })
  if (!app || !app.onboarding?.sentAt) {
    return NextResponse.json({ error: 'No onboarding pack found for this link.' }, { status: 404 })
  }
  if (app.onboarding.acknowledgedAt) {
    return NextResponse.json({ error: 'This onboarding pack has already been acknowledged.' }, { status: 409 })
  }

  const docs = app.onboarding.docs || []
  const confirmed = new Set((body.documents || []).map(String))
  if (docs.length && confirmed.size < docs.length) {
    return NextResponse.json({ error: 'Please confirm every document before signing.' }, { status: 400 })
  }

  const ip =
    (req.headers.get('cf-connecting-ip') ||
      (req.headers.get('x-forwarded-for') || '').split(',')[0] ||
      'unknown').trim()

  const now = new Date()
  for (const d of docs) {
    if (confirmed.has(d.filename)) d.acknowledgedAt = now
  }
  app.onboarding.docs = docs
  app.onboarding.acknowledgedAt = now
  app.onboarding.acknowledgedName = typedName
  app.onboarding.signatureName = typedName
  app.onboarding.ip = ip
  app.onboarding.bciConsentAt = now
  app.markModified('onboarding')
  await app.save()

  sendOnboardingAckNotice({
    name: app.name, ref: app.ref, role: app.role, employeeNumber: app.employeeNumber,
    ackName: typedName, ip, bci: true, docCount: docs.length,
  }).catch((e) => console.error('[onboarding] ack-notice failed:', e))

  return NextResponse.json({ ok: true })
}
