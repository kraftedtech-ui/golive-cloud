import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import DocumentIssuance from '@/models/DocumentIssuance'
import { verifyIssuanceToken } from '@/lib/issuanceToken'
import { sendIssuanceSignedNotice } from '@/lib/issuanceEmail'

export const dynamic = 'force-dynamic'

// Public, token-authenticated: the employee confirms EACH document
// individually, then signs once with their typed legal name.
//
// Per-document timestamps are recorded so the audit trail shows what was read
// and when. A single blanket acceptance would not evidence that the targets
// document was read as well as the letter it accompanied.
export async function POST(req: NextRequest) {
  let body: { token?: string; typedName?: string; documents?: string[] } = {}
  try { body = await req.json() } catch { /* fallthrough */ }

  const v = verifyIssuanceToken(String(body.token || ''))
  if (!v) return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 401 })

  const typedName = String(body.typedName || '').trim().replace(/\s+/g, ' ')
  if (typedName.length < 5 || !typedName.includes(' ') || typedName.length > 100) {
    return NextResponse.json({ error: 'Please type your full legal name.' }, { status: 400 })
  }

  await connectDB()
  const iss = await DocumentIssuance.findOne({ ref: v.ref })
  if (!iss || !iss.sentAt) {
    return NextResponse.json({ error: 'No documents found for this link.' }, { status: 404 })
  }
  if (iss.signedAt) {
    return NextResponse.json({ error: 'These documents have already been signed.' }, { status: 409 })
  }

  const docs = iss.docs || []
  const confirmed = new Set((body.documents || []).map(String))
  if (!docs.length || confirmed.size < docs.length) {
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
  iss.docs = docs
  iss.signedAt = now
  iss.signatureName = typedName
  iss.ip = ip
  iss.status = 'signed'
  iss.markModified('docs')
  await iss.save()

  sendIssuanceSignedNotice({
    name: iss.employeeName, ref: iss.ref, employeeNumber: iss.employeeNumber,
    title: iss.title, signatureName: typedName, signedAt: now, ip, docCount: docs.length,
  }).catch((e) => console.error('[issuance] signed notice failed:', e))

  return NextResponse.json({ ok: true })
}
