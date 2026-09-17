import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import DocumentIssuance from '@/models/DocumentIssuance'
import { verifyIssuanceToken } from '@/lib/issuanceToken'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const EMP_DIR = path.join(process.cwd(), 'employee-docs')
const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

// Public, token-authenticated: stream one document of an issuance.
// The token names the issuance, and only a filename listed on that issuance
// can be served, so the employee's wider document file stays private.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const v = verifyIssuanceToken(String(url.searchParams.get('token') || ''))
  if (!v) return NextResponse.json({ error: 'Link invalid or expired' }, { status: 401 })

  const f = path.basename(String(url.searchParams.get('f') || ''))
  if (!f) return NextResponse.json({ error: 'f required' }, { status: 400 })

  await connectDB()
  const iss = await DocumentIssuance.findOne({ ref: v.ref })
    .select('employeeNumber docs').lean() as {
      employeeNumber?: string
      docs?: { filename?: string }[]
    } | null
  if (!iss) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doc = iss.docs?.find((d) => d.filename === f)
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  const full = path.join(
    EMP_DIR,
    String(iss.employeeNumber).replace(/[^a-zA-Z0-9-]/g, '_'),
    f
  )
  if (!fs.existsSync(full)) {
    return NextResponse.json({ error: 'File missing on server' }, { status: 404 })
  }

  const buf = fs.readFileSync(full)
  const ext = path.extname(f).toLowerCase()
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${f}"`,
      'Cache-Control': 'no-store',
    },
  })
}
