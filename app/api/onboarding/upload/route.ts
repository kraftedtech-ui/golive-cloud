import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DIR = path.join(process.cwd(), 'onboarding-docs')
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED = /\.(pdf|docx?|xlsx?)$/i

// Admin: upload an onboarding document for a hire (multipart: ref, file)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let form: FormData
  try { form = await req.formData() } catch { return NextResponse.json({ error: 'Multipart form expected' }, { status: 400 }) }

  const ref = String(form.get('ref') || '')
  const file = form.get('file') as File | null
  if (!ref || !file) return NextResponse.json({ error: 'ref and file required' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 15 MB' }, { status: 413 })

  const safeName = path.basename(String(file.name)).replace(/[^a-zA-Z0-9._-]+/g, '_')
  if (!ALLOWED.test(safeName)) return NextResponse.json({ error: 'Only PDF, Word, or Excel documents' }, { status: 415 })

  await connectDB()
  const app = await Application.findOne({ ref })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!app.offer?.mdSignedAt) return NextResponse.json({ error: 'Onboarding opens after the offer is fully executed' }, { status: 409 })

  const dir = path.join(DIR, ref.replace(/[^a-zA-Z0-9-]/g, '_'))
  fs.mkdirSync(dir, { recursive: true })
  const buf = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(dir, safeName), buf)

  const label = safeName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
  if (!app.onboarding) app.onboarding = { docs: [] } as never
  const docs = app.onboarding!.docs || []
  const existing = docs.find((d: { filename?: string }) => d.filename === safeName)
  if (existing) existing.uploadedAt = new Date()
  else docs.push({ filename: safeName, label, uploadedAt: new Date() })
  app.onboarding!.docs = docs
  app.markModified('onboarding')
  await app.save()

  return NextResponse.json({ ok: true, filename: safeName, count: docs.length })
}
