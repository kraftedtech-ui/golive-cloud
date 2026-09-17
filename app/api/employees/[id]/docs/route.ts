import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Employee from '@/models/Employee'
import Application from '@/models/Application'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Employee-file documents live in employee-docs/<EMP-NO>/ (mirrors the
// onboarding-docs/<APP-REF>/ convention). Pipeline hires' onboarding docs
// stay where the acknowledgement flow put them — onboarding-docs/<APP-REF>/ —
// and are streamed from there via src=application. Single copy, two views.
const EMP_DIR = path.join(process.cwd(), 'employee-docs')
const APP_DIR = path.join(process.cwd(), 'onboarding-docs')
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED = /\.(pdf|docx?|xlsx?)$/i
const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

const safeSeg = (s: string) => s.replace(/[^a-zA-Z0-9-]/g, '_')

// Admin: upload a document onto the employee file (multipart: file, label?).
// Used for signed paperwork executed outside the portal (legacy hires) and
// any later additions to the file.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: 'Multipart form expected' }, { status: 400 })
  }
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 15 MB' }, { status: 413 })

  const safeName = path.basename(String(file.name)).replace(/[^a-zA-Z0-9._-]+/g, '_')
  if (!ALLOWED.test(safeName)) {
    return NextResponse.json({ error: 'Only PDF, Word, or Excel documents' }, { status: 415 })
  }

  await connectDB()
  const employee = await Employee.findById(id)
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const dir = path.join(EMP_DIR, safeSeg(employee.employeeNumber))
  fs.mkdirSync(dir, { recursive: true })
  const buf = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(dir, safeName), buf)

  const label =
    String(form.get('label') || '') ||
    safeName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
  const docs = employee.docs || []
  const existing = docs.find((d: { filename?: string }) => d.filename === safeName)
  if (existing) existing.uploadedAt = new Date()
  else docs.push({ filename: safeName, label, uploadedAt: new Date(), executedExternally: true })
  employee.docs = docs
  employee.markModified('docs')
  await employee.save()

  return NextResponse.json({ ok: true, filename: safeName, count: docs.length })
}

// Admin: stream one document from the employee file.
//   ?f=<filename>&src=employee     — a directly uploaded document
//   ?f=<filename>&src=application  — an onboarding doc on the linked application
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const url = new URL(req.url)
  const f = path.basename(String(url.searchParams.get('f') || ''))
  const src = String(url.searchParams.get('src') || 'employee')
  if (!f) return NextResponse.json({ error: 'f required' }, { status: 400 })

  await connectDB()
  const employee = await Employee.findById(id).lean() as {
    employeeNumber?: string
    applicationRef?: string | null
    docs?: { filename?: string }[]
  } | null
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  let full = ''
  if (src === 'application') {
    if (!employee.applicationRef) {
      return NextResponse.json({ error: 'No linked application' }, { status: 404 })
    }
    const app = await Application.findOne({ ref: employee.applicationRef })
      .select('onboarding.docs').lean() as {
        onboarding?: { docs?: { filename?: string }[] }
      } | null
    const doc = app?.onboarding?.docs?.find((d) => d.filename === f)
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    full = path.join(APP_DIR, safeSeg(employee.applicationRef), f)
  } else {
    const doc = employee.docs?.find((d) => d.filename === f)
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    full = path.join(EMP_DIR, safeSeg(String(employee.employeeNumber)), f)
  }

  if (!fs.existsSync(full)) {
    return NextResponse.json({ error: 'File missing on server' }, { status: 404 })
  }
  const buf = fs.readFileSync(full)
  const ext = path.extname(f).toLowerCase()
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${f}"`,
      'Cache-Control': 'no-store',
    },
  })
}
