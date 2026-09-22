import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const CV_DIR = path.join(process.cwd(), 'applications-cv')
const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

/**
 * Admin: open an applicant's CV (?ref=GL-APP-2026-0020).
 *
 * Only the file named on the application record is served, from that
 * application's own folder, so the path cannot be steered to anything else.
 * PDFs open in the browser; Word documents download.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const ref = new URL(req.url).searchParams.get('ref') || ''
  if (!/^GL-APP-\d{4}-\d{4}$/.test(ref)) return NextResponse.json({ error: 'A valid reference is required.' }, { status: 400 })

  await connectDB()
  const app = await Application.findOne({ ref }).select('ref name cvFilename').lean() as
    { ref: string; name: string; cvFilename?: string } | null
  if (!app?.cvFilename) return NextResponse.json({ error: 'No CV on this application.' }, { status: 404 })

  const file = path.basename(app.cvFilename)
  const full = path.join(CV_DIR, ref, file)
  if (!fs.existsSync(full)) return NextResponse.json({ error: 'The CV file is missing on the server.' }, { status: 404 })

  const ext = path.extname(file).toLowerCase()
  const niceName = `${ref}_${String(app.name).replace(/[^a-z0-9]+/gi, '_')}_CV${ext}`
  return new NextResponse(new Uint8Array(fs.readFileSync(full)), {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Disposition': `${ext === '.pdf' ? 'inline' : 'attachment'}; filename="${niceName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
