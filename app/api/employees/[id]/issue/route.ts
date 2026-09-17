import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Employee from '@/models/Employee'
import DocumentIssuance from '@/models/DocumentIssuance'
import { signIssuanceToken } from '@/lib/issuanceToken'
import { sendIssuanceEmail } from '@/lib/issuanceEmail'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Issued documents are stored in the employee's own document directory, so an
// executed copy and the file it belongs to never drift apart.
const EMP_DIR = path.join(process.cwd(), 'employee-docs')
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED = /\.(pdf|docx?)$/i
const safeSeg = (s: string) => s.replace(/[^a-zA-Z0-9-]/g, '_')

const KINDS = new Set(['confirmation', 'targets', 'promotion', 'policy', 'other'])

async function nextRef(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `GL-ISS-${year}-`
  // distinct() returns plain values, which avoids asserting a shape onto
  // Mongoose's inferred lean() type.
  const existing = (await DocumentIssuance.distinct('ref', {
    ref: { $regex: '^' + prefix },
  })) as string[]
  const max = existing.reduce((mx: number, r: string) => {
    const n = parseInt(String(r).slice(prefix.length), 10) || 0
    return Math.max(mx, n)
  }, 0)
  return prefix + String(max + 1).padStart(4, '0')
}

// Admin: list this employee's issuances.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  await connectDB()
  const issuances = await DocumentIssuance.find({ employeeId: id })
    .sort({ createdAt: -1 }).lean()
  return NextResponse.json({ issuances })
}

// Admin: create an issuance and email the signing link.
// Multipart: title, kind, message?, deadlineDays?, file (1..6, repeatable),
// label (optional, one per file, same order).
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

  const title = String(form.get('title') || '').trim()
  const kindRaw = String(form.get('kind') || 'other')
  const kind = KINDS.has(kindRaw) ? kindRaw : 'other'
  const message = String(form.get('message') || '').trim() || undefined
  const deadlineDays = Math.min(60, Math.max(1, parseInt(String(form.get('deadlineDays') || '14'), 10) || 14))
  if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 })

  const files = form.getAll('file').filter((f): f is File => f instanceof File)
  const labels = form.getAll('label').map((l) => String(l || ''))
  if (!files.length) return NextResponse.json({ error: 'Attach at least one document' }, { status: 400 })
  if (files.length > 6) return NextResponse.json({ error: 'Six documents maximum per issuance' }, { status: 400 })

  await connectDB()
  const employee = await Employee.findById(id)
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  // The link goes to a real inbox. Prefer the work address when set.
  const to = String(employee.workEmail || employee.email || '').toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: 'This employee has no valid email address on file' }, { status: 409 })
  }

  const dir = path.join(EMP_DIR, safeSeg(employee.employeeNumber))
  fs.mkdirSync(dir, { recursive: true })

  const docs: { filename: string; label: string }[] = []
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (f.size > MAX_BYTES) {
      return NextResponse.json({ error: `${f.name} exceeds 15 MB` }, { status: 413 })
    }
    const safeName = path.basename(String(f.name)).replace(/[^a-zA-Z0-9._-]+/g, '_')
    if (!ALLOWED.test(safeName)) {
      return NextResponse.json({ error: `${f.name}: only PDF or Word documents` }, { status: 415 })
    }
    fs.writeFileSync(path.join(dir, safeName), Buffer.from(await f.arrayBuffer()))
    docs.push({
      filename: safeName,
      label: (labels[i] || '').trim() || safeName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
    })
  }

  const ref = await nextRef()
  const deadline = new Date(Date.now() + deadlineDays * 864e5)
  const issuance = await DocumentIssuance.create({
    ref,
    employeeId: String(employee._id),
    employeeNumber: employee.employeeNumber,
    employeeName: employee.name,
    employeeEmail: to,
    role: employee.role,
    jobCode: employee.jobCode,
    kind,
    title,
    message,
    docs,
    status: 'sent',
    sentAt: new Date(),
    deadline,
  })

  // Also record the documents on the employee file, so the file is complete
  // whether or not the issuance is ever signed.
  const fileDocs = employee.docs || []
  for (const d of docs) {
    const existing = fileDocs.find((x: { filename?: string }) => x.filename === d.filename)
    if (existing) existing.uploadedAt = new Date()
    else fileDocs.push({ filename: d.filename, label: d.label, uploadedAt: new Date(), executedExternally: false })
  }
  employee.docs = fileDocs
  employee.markModified('docs')
  await employee.save()

  const token = signIssuanceToken(ref, deadline)
  const result = await sendIssuanceEmail({
    name: employee.name, email: to, title, message,
    docLabels: docs.map((d) => d.label), deadline, token,
  })

  if (!result.ok) {
    // The issuance exists and the documents are stored; only delivery failed.
    // Report it plainly rather than pretending the employee was notified.
    return NextResponse.json(
      { ok: false, ref, emailSent: false, error: result.error || 'Email delivery failed' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, ref, emailSent: true, issuance })
}
