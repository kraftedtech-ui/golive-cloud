import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { SCREENING_PROVIDER, type ScreeningStatus } from '@/lib/hireProvisioning'
import { sendScreeningLinkEmail } from '@/lib/screeningEmail'

export const dynamic = 'force-dynamic'

const VALID: ScreeningStatus[] = ['pending', 'in_progress', 'cleared', 'failed']

// Admin: record where the BCI background check stands for a hire.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: { ref?: string; status?: string; notes?: string; link?: string; note?: string; sendLink?: boolean } = {}
  try { body = await req.json() } catch { /* fallthrough */ }

  const ref = String(body.ref || '')
  const status = String(body.status || '') as ScreeningStatus
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
  if (!VALID.includes(status)) return NextResponse.json({ error: 'Invalid screening status' }, { status: 400 })

  await connectDB()
  const app = await Application.findOne({ ref })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!app.onboarding?.acknowledgedAt) {
    return NextResponse.json(
      { error: 'The hire has not completed the onboarding acknowledgement (which carries their screening consent) yet.' },
      { status: 409 }
    )
  }

  // A screening link may accompany the status change. It is only emailed on
  // an explicit sendLink, so correcting a mistyped URL never re-mails the
  // candidate, and re-sending is always a deliberate act.
  const link = typeof body.link === 'string' ? body.link.trim() : ''
  if (link && !/^https:\/\/[^\s]+$/i.test(link)) {
    return NextResponse.json(
      { error: 'The screening link must be a full https:// URL.' },
      { status: 400 }
    )
  }

  const prev = app.screening || {}
  app.screening = {
    ...prev,
    provider: SCREENING_PROVIDER,
    status,
    notes: typeof body.notes === 'string' ? body.notes : prev.notes,
    link: link || prev.link,
    linkSentAt: prev.linkSentAt,
    initiatedAt: prev.initiatedAt || (status !== 'pending' ? new Date() : undefined),
    clearedAt: status === 'cleared' ? new Date() : undefined,
  }

  let emailSent = false
  let emailError: string | undefined
  if (body.sendLink) {
    const useLink = link || prev.link || ''
    if (!useLink) {
      return NextResponse.json({ error: 'No screening link to send.' }, { status: 400 })
    }
    const result = await sendScreeningLinkEmail({
      name: app.name,
      email: app.email,
      role: app.role,
      link: useLink,
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : undefined,
    })
    emailSent = result.ok
    emailError = result.error
    if (result.ok) app.screening.linkSentAt = new Date()
  }

  app.markModified('screening')
  await app.save()

  // The status change is saved either way. A delivery failure is reported
  // plainly rather than silently leaving the admin to assume the candidate
  // was emailed.
  return NextResponse.json({
    ok: true,
    screening: app.screening,
    emailSent,
    ...(emailError ? { emailError } : {}),
  })
}
