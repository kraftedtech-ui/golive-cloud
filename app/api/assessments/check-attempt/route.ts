import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')
const SECRET = process.env.ASSESSMENT_UPLOAD_SECRET || 'golive-assessment-2026'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-upload-token')
    if (token !== SECRET) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { email, role } = await req.json()
    if (!email) return NextResponse.json({ allowed: true })

    const files = await readdir(RECORDINGS_DIR).catch(() => [] as string[])
    const jsons = files.filter(f => f.endsWith('.json'))

    for (const file of jsons) {
      try {
        const raw = await readFile(path.join(RECORDINGS_DIR, file), 'utf-8')
        const meta = JSON.parse(raw)
        if (
          meta.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
          meta.role === role
        ) {
          return NextResponse.json({
            allowed: false,
            message: `Our records show you have already completed the ${role} assessment. Only one attempt is permitted per applicant. Please contact contact@golivecompany.com if you believe this is an error.`
          })
        }
      } catch { continue }
    }

    return NextResponse.json({ allowed: true })
  } catch (err) {
    console.error('[check-attempt]', err)
    return NextResponse.json({ allowed: true })
  }
}
