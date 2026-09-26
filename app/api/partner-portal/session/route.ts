import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import PartnerApplication from '@/models/PartnerApplication'
import { verifyEmailToken } from '@/lib/publicVerification'
import { canSignIn, setPartnerSession, clearPartnerSession } from '@/lib/partnerSession'

export const dynamic = 'force-dynamic'

/** Sign in with a verified one-time code. Body { email, verificationToken }. */
export async function POST(req: NextRequest) {
  let body: { email?: string; verificationToken?: string } = {}
  try { body = await req.json() } catch { /* fallthrough */ }
  const email = String(body.email || '').trim().toLowerCase()
  if (!email || !verifyEmailToken(String(body.verificationToken || ''), email)) {
    return NextResponse.json({ error: 'Your code has expired. Please request a new one.' }, { status: 401 })
  }
  await connectDB()
  const apps = await PartnerApplication.find({ 'applicant.email': email, status: 'active' }).sort({ updatedAt: -1 })
  const app = apps.find((a) => canSignIn(a)) || null
  if (!app) {
    // Same answer whether the email is unknown or not yet appointed: no account enumeration.
    return NextResponse.json({ error: 'This email is not registered to an active GoLive partner. If you have been appointed, use the email on your agreement, or contact partners@golivecompany.com.' }, { status: 403 })
  }
  app.timeline.push({ at: new Date(), by: email, action: 'Signed in to the partner dashboard' })
  await app.save()
  return setPartnerSession(NextResponse.json({ ok: true }), app.ref)
}

/** Sign out. */
export async function DELETE() {
  return clearPartnerSession(NextResponse.json({ ok: true }))
}
