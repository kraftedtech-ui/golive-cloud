import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { verifyOfferToken } from '@/lib/offerToken'
import { sendCandidateSignedNotice } from '@/lib/offerEmail'

export const dynamic = 'force-dynamic'

// Public, token-authenticated: candidate signs their offer.
export async function POST(req: NextRequest) {
  let body: { token?: string; typedName?: string } = {}
  try { body = await req.json() } catch { /* fallthrough */ }

  const v = verifyOfferToken(String(body.token || ''))
  if (!v) return NextResponse.json({ error: 'This offer link is invalid or has expired.' }, { status: 401 })

  const typedName = String(body.typedName || '').trim().replace(/\s+/g, ' ')
  if (typedName.length < 5 || !typedName.includes(' ') || typedName.length > 100) {
    return NextResponse.json({ error: 'Please type your full legal name.' }, { status: 400 })
  }

  await connectDB()
  const app = await Application.findOne({ ref: v.ref })
  if (!app || !app.offer || !app.offer.sentAt) {
    return NextResponse.json({ error: 'No active offer found for this link.' }, { status: 404 })
  }
  if (app.offer.candidateSignedAt) {
    return NextResponse.json({ error: 'This offer has already been signed.' }, { status: 409 })
  }
  if (app.offer.deadline && new Date(app.offer.deadline).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This offer has lapsed. Please contact talent.acquisition@golivecompany.com.' }, { status: 410 })
  }

  const ip =
    (req.headers.get('cf-connecting-ip') ||
      (req.headers.get('x-forwarded-for') || '').split(',')[0] ||
      'unknown').trim()

  app.offer.candidateSignedAt = new Date()
  app.offer.candidateSignedName = typedName
  app.offer.candidateIp = ip
  app.markModified('offer')
  await app.save()

  // Notify the MD — failure here never blocks the signature.
  sendCandidateSignedNotice({
    name: app.name, ref: app.ref, role: app.role, signedName: typedName, ip,
  }).catch((e) => console.error('[offer] signed-notice failed:', e))

  return NextResponse.json({ ok: true })
}
