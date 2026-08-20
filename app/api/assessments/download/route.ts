import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir, stat } from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const file = searchParams.get('file')

  if (!file) {
    try {
      const files = await readdir(RECORDINGS_DIR)
      const webms = files
        .filter(f => f.endsWith('.webm') && !f.includes('Test_Candidate'))
        .sort((a, b) => b.localeCompare(a))

      const recordings = await Promise.all(webms.map(async f => {
        const filepath = path.join(RECORDINGS_DIR, f)
        const jsonpath = filepath.replace('.webm', '.json')
        const s = await stat(filepath)

        // Try sidecar first, fall back to filename parsing
        try {
          const raw = await readFile(jsonpath, 'utf-8')
          const meta = JSON.parse(raw)
          const [got, max] = (meta.score || '0-0').split('-')
          const pct = max ? Math.round((parseInt(got) / parseInt(max)) * 100) : 0
          return {
            filename: f,
            candidate: meta.candidate || 'Unknown',
            email: meta.email || '',
            role: meta.role || 'Unknown Role',
            score: `${got}/${max}`,
            pct,
            verdict: pct >= 75 ? 'Strong' : pct >= 50 ? 'Borderline' : 'Weak',
            sizeMB: meta.sizeMB || (s.size / 1024 / 1024).toFixed(1),
            submitted: meta.submitted || s.mtime.toISOString(),
          }
        } catch {
          // Fall back: parse filename
          const parts = f.replace('.webm', '').split('_score')
          const score = parts[1] || '0-0'
          const nameRaw = parts[0].split('_').slice(2).join(' ')
          const [got, max] = score.split('-')
          const pct = max ? Math.round((parseInt(got) / parseInt(max)) * 100) : 0
          return {
            filename: f,
            candidate: nameRaw || 'Unknown',
            email: '',
            role: 'Unknown Role',
            score: `${got}/${max}`,
            pct,
            verdict: pct >= 75 ? 'Strong' : pct >= 50 ? 'Borderline' : 'Weak',
            sizeMB: (s.size / 1024 / 1024).toFixed(1),
            submitted: s.mtime.toISOString(),
          }
        }
      }))
      return NextResponse.json({ recordings })
    } catch {
      return NextResponse.json({ recordings: [] })
    }
  }

  // Download specific file
  const safe = path.basename(file)
  if (!safe.endsWith('.webm')) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
  }
  try {
    const buffer = await readFile(path.join(RECORDINGS_DIR, safe))
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'video/webm',
        'Content-Disposition': `attachment; filename="${safe}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
