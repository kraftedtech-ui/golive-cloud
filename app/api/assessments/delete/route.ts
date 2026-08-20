import { NextRequest, NextResponse } from 'next/server'
import { unlink, stat } from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'

const RECORDINGS_DIR = path.join(process.cwd(), 'recordings')

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/assessments/delete?file=<recording filename>
 *
 * On-demand erasure of a single candidate's assessment material, for when a
 * candidate exercises their right to erasure under the Nigeria Data
 * Protection Act 2023, or when material is no longer needed before the
 * 60-day automatic retention window expires.
 *
 * Removes the recording, the metadata sidecar, and the transcript,
 * violations and filename held on the Application record. The hiring
 * outcome (score, date, status) is deliberately retained — that is the
 * record of a decision, not raw personal content.
 *
 * Admin session required. The filename is validated against a strict
 * pattern and the resolved path is confirmed to sit inside the recordings
 * directory, so a crafted value cannot reach anything else on disk.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const file = searchParams.get('file')
  if (!file) {
    return NextResponse.json({ error: 'file parameter required' }, { status: 400 })
  }

  // Recordings are written as <timestamp>_<name>_<role>_score<n-n>.webm by
  // the save-recording route. Anything not matching that shape is refused
  // rather than sanitised, so there is no path to traversal at all.
  if (!/^[0-9T:-]+_[A-Za-z0-9_]+_score[0-9-]+\.webm$/.test(file)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const webm = path.resolve(RECORDINGS_DIR, file)
  const json = webm.replace(/\.webm$/, '.json')
  if (!webm.startsWith(RECORDINGS_DIR + path.sep)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const removed: string[] = []
  let bytes = 0

  for (const target of [webm, json]) {
    try {
      const s = await stat(target)
      bytes += s.size
      await unlink(target)
      removed.push(path.basename(target))
    } catch {
      // Already gone — erasure is idempotent by design.
    }
  }

  let scrubbed = 0
  try {
    await connectDB()
    const res = await Application.updateMany(
      { assessmentFilename: file },
      {
        $unset: { transcript: '', violations: '', assessmentFilename: '' },
        $set: { assessmentPurgedAt: new Date() },
      }
    )
    scrubbed = res.modifiedCount ?? 0
  } catch (err) {
    console.error('[assessments/delete] record scrub failed:', err)
    return NextResponse.json(
      { error: 'Files removed but record scrub failed', removed },
      { status: 500 }
    )
  }

  console.log(
    `[assessments/delete] ${session.user?.email} erased ${file} —`,
    `${removed.length} file(s), ${scrubbed} record(s)`
  )

  return NextResponse.json({
    success: true,
    removed,
    scrubbed,
    freedMB: Number((bytes / 1048576).toFixed(1)),
  })
}
