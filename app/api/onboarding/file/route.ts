import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { verifyOnboardingToken } from '@/lib/onboardingToken'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const DIR = path.join(process.cwd(), 'onboarding-docs')
const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

// Public, token-authenticated: stream one onboarding document.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const v = verifyOnboardingToken(String(url.searchParams.get('token') || ''))
  if (!v) return NextResponse.json({ error: 'Link invalid or expired' }, { status: 401 })

  const f = path.basename(String(url.searchParams.get('f') || ''))
  if (!f) return NextResponse.json({ error: 'f required' }, { status: 400 })

  await connectDB()
  const app = (await Application.findOne({ ref: v.ref }).lean()) as {
    onboarding?: { docs?: { filename?: string }[] }
  } | null
  const doc = app?.onboarding?.docs?.find((d) => d.filename === f)
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  const full = path.join(DIR, v.ref.replace(/[^a-zA-Z0-9-]/g, '_'), f)
  if (!fs.existsSync(full)) return NextResponse.json({ error: 'File missing on server' }, { status: 404 })

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
