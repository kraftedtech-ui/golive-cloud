import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import Position from '@/models/Position'
import { ensureSeeded, remaining } from '@/lib/positions'
import { generateAccessCode, sendApplicationReceived, ASSESSMENT_WINDOW_DAYS, ASSESSMENT_PAGE } from '@/lib/recruitment'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Public: apply for an open position from /careers.
 *
 * Creates the application, stores the CV under applications-cv/<REF>/, and
 * emails the applicant a personal assessment code. The code is generated
 * here and only ever sent to the address given, so it cannot be obtained
 * without controlling that mailbox.
 *
 * Because this is public, every input is validated and bounded, and a second
 * application from the same address for the same position is refused rather
 * than creating a duplicate.
 */
const CV_DIR = path.join(process.cwd(), 'applications-cv')
const MAX_CV = 5 * 1024 * 1024
const ALLOWED_CV = /\.(pdf|docx?)$/i

async function nextRef(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `GL-APP-${year}-`
  const refs = (await Application.distinct('ref', { ref: { $regex: `^${prefix}` } })) as string[]
  const max = refs.reduce((m, r) => Math.max(m, parseInt(r.slice(prefix.length), 10) || 0), 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export async function POST(req: NextRequest) {
  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: 'Please complete the form and try again.' }, { status: 400 })
  }
  const slug = String(form.get('position') || '').trim()
  const name = String(form.get('name') || '').trim().replace(/\s+/g, ' ').slice(0, 100)
  const email = String(form.get('email') || '').trim().toLowerCase().slice(0, 200)
  const phone = String(form.get('phone') || '').trim().slice(0, 40)
  const note = String(form.get('note') || '').trim().slice(0, 1500)
  const cv = form.get('cv')

  if (!slug) return NextResponse.json({ error: 'Choose the position you are applying for.' }, { status: 400 })
  if (name.length < 3 || !name.includes(' ')) {
    return NextResponse.json({ error: 'Enter your full name.' }, { status: 400 })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address. Your assessment code will be sent to it.' }, { status: 400 })
  }
  if (!(cv instanceof File) || cv.size === 0) {
    return NextResponse.json({ error: 'Attach your CV as a PDF or Word document.' }, { status: 400 })
  }
  if (cv.size > MAX_CV) return NextResponse.json({ error: 'Your CV must be 5 MB or smaller.' }, { status: 413 })
  const cvName = path.basename(cv.name || 'cv').replace(/[^a-zA-Z0-9._-]+/g, '_')
  if (!ALLOWED_CV.test(cvName)) {
    return NextResponse.json({ error: 'Your CV must be a PDF or Word document.' }, { status: 415 })
  }

  await ensureSeeded()
  const position = await Position.findOne({ slug, status: 'open' })
  if (!position || remaining(position) <= 0) {
    return NextResponse.json({ error: 'This position is no longer open for applications.' }, { status: 409 })
  }
  if (!ASSESSMENT_PAGE[position.title]) {
    return NextResponse.json(
      { error: 'Applications for this position are not open online yet. Please email talent.acquisition@golivecompany.com.' },
      { status: 409 }
    )
  }

  await connectDB()
  const existing = await Application.findOne({ email, role: position.title }).select('ref status').lean() as
    { ref: string; status: string } | null
  if (existing) {
    return NextResponse.json(
      { error: `You have already applied for this position (reference ${existing.ref}). One application per position is permitted. If you did not receive your assessment code, email talent.acquisition@golivecompany.com.` },
      { status: 409 }
    )
  }

  const ref = await nextRef()
  const code = generateAccessCode()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ASSESSMENT_WINDOW_DAYS * 864e5)

  const dir = path.join(CV_DIR, ref)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, cvName), Buffer.from(await cv.arrayBuffer()))

  await Application.create({
    ref,
    name,
    email,
    role: position.title,
    status: 'applied',
    phone: phone || undefined,
    note: note || undefined,
    cvFilename: cvName,
    positionSlug: position.slug,
    source: 'careers',
    accessCode: code,
    codeSentAt: now,
    codeExpiresAt: expiresAt,
  })

  const mail = await sendApplicationReceived({ name, email, role: position.title, ref, code, expiresAt })
  if (!mail.ok) console.error(`[careers/apply] code email to ${ref} failed:`, mail.error)

  return NextResponse.json({ ok: true, ref, emailSent: mail.ok })
}
