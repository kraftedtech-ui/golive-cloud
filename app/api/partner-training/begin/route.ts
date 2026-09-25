import { NextRequest, NextResponse } from 'next/server'
import { loadByToken } from '../_load'
import { closeExpired, trainingState, openAttempt } from '@/lib/partnerTrainingFlow'
import { bankFor } from '@/lib/partnerAssessmentBank'
import { issuePaper, publicPaper, secondsLeft, type Paper } from '@/lib/assessmentPaper'
import { STAGE_LABELS } from '@/lib/partnerConfig'

export const dynamic = 'force-dynamic'

/**
 * Partner (token): start the integrity check or the partner assessment.
 * Issues the paper on the server and starts its clock; a paper already in
 * progress is returned unchanged rather than redrawn.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; kind?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  const kind = body.kind === 'final' ? 'final' : body.kind === 'integrity' ? 'integrity' : null
  if (!kind) return NextResponse.json({ error: 'Unknown assessment' }, { status: 400 })
  const app = await loadByToken(body.token)
  if (!app) return NextResponse.json({ error: 'This training link is not valid or has expired.' }, { status: 401 })
  closeExpired(app)

  const bank = bankFor(kind)
  const existing = openAttempt(app, kind)
  if (existing) {
    await app.save()
    const paper = existing.paper as Paper
    return NextResponse.json({ kind, number: existing.number, questions: publicPaper(bank, paper), secondsLeft: secondsLeft(paper) })
  }

  const state = trainingState(app)
  const s = kind === 'integrity' ? state.integrity : state.final
  if (!s.canBegin) {
    await app.save()
    return NextResponse.json({ error: s.reason || state.closedReason || 'Not available yet.' }, { status: 409 })
  }

  const now = new Date()
  const paper = issuePaper(bank, now)
  const number = (app.attempts || []).filter((a) => a.kind === kind).length + 1
  app.attempts.push({ kind, number, paper, startedAt: now })
  app.markModified('attempts')
  if (kind === 'final' && app.status === 'training') {
    app.timeline.push({ at: now, by: 'system', action: `Stage: ${STAGE_LABELS.training} to ${STAGE_LABELS.assessment}`, note: 'Started the partner assessment' })
    app.status = 'assessment'
  }
  app.timeline.push({ at: now, by: app.applicant.email, action: `${kind === 'final' ? 'Partner assessment' : 'Integrity check'} started, attempt ${number}` })
  await app.save()
  return NextResponse.json({ kind, number, questions: publicPaper(bank, paper), secondsLeft: secondsLeft(paper) })
}
