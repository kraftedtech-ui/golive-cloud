import { NextRequest, NextResponse } from 'next/server'
import { loadByToken } from '../_load'
import { openAttempt, trainingState, sendFinalResult, sendFinalNotice } from '@/lib/partnerTrainingFlow'
import { bankFor } from '@/lib/partnerAssessmentBank'
import { markPaper, isLate, type Paper } from '@/lib/assessmentPaper'
import { ASSESSMENT_RULES } from '@/lib/partnerTraining'
import { STAGE_LABELS } from '@/lib/partnerConfig'

export const dynamic = 'force-dynamic'

const n = (v: unknown, max = 100000) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)))

/**
 * Partner (token): submit answers. Marked here against the server-side bank;
 * the browser never sees the key. The integrity counts are what the page
 * disclosed before the first question, and nothing else.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; kind?: string; answers?: Record<string, unknown>; integrity?: Record<string, unknown> }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  const kind = body.kind === 'final' ? 'final' : body.kind === 'integrity' ? 'integrity' : null
  if (!kind) return NextResponse.json({ error: 'Unknown assessment' }, { status: 400 })
  const app = await loadByToken(body.token)
  if (!app) return NextResponse.json({ error: 'This training link is not valid or has expired.' }, { status: 401 })

  const attempt = openAttempt(app, kind)
  if (!attempt) return NextResponse.json({ error: 'There is no assessment in progress to submit.' }, { status: 409 })

  const now = new Date()
  const paper = attempt.paper as Paper
  const marked = markPaper(bankFor(kind), paper, body.answers && typeof body.answers === 'object' ? body.answers : {}, {})
  const rules = ASSESSMENT_RULES[kind]
  const late = isLate(paper, now)
  const i = body.integrity || {}

  attempt.submittedAt = now
  attempt.got = marked.got
  attempt.max = marked.max
  attempt.pct = marked.pct
  attempt.late = late
  attempt.passed = !late && marked.pct >= rules.passPct
  attempt.transcript = marked.transcript
  attempt.integrity = {
    tabSwitches: n(i.tabSwitches, 1000), focusLoss: n(i.focusLoss, 1000),
    pasteTries: n(i.pasteTries, 1000), copyTries: n(i.copyTries, 1000),
    seconds: Math.min(n(i.seconds), Math.ceil((now.getTime() - new Date(paper.issuedAt).getTime()) / 1000)),
  }
  app.markModified('attempts')
  const label = kind === 'final' ? 'Partner assessment' : 'Integrity check'
  app.timeline.push({
    at: now, by: app.applicant.email,
    action: `${label} attempt ${attempt.number}: ${marked.pct}% (${attempt.passed ? 'passed' : 'not passed'})${late ? ', late' : ''}`,
    note: `${attempt.integrity.tabSwitches} tab switches, ${attempt.integrity.focusLoss} focus losses, ${attempt.integrity.pasteTries} paste, ${attempt.integrity.copyTries} copy attempts`,
  })

  if (kind === 'final' && attempt.passed) {
    app.assessmentPassedAt = now
    if (['training', 'assessment'].includes(app.status)) {
      app.timeline.push({ at: now, by: 'system', action: `Stage: ${STAGE_LABELS[app.status]} to ${STAGE_LABELS.agreement}`, note: 'Partner assessment passed' })
      app.status = 'agreement'
    }
  }
  await app.save()

  const state = trainingState(app)
  if (kind === 'final') {
    const [r, notice] = await Promise.all([sendFinalResult(app, attempt, state.final.availableFrom), sendFinalNotice(app, attempt)])
    if (!r.ok) console.error(`[partner-training] result email ${app.ref} failed:`, r.error)
    if (!notice.ok) console.error(`[partner-training] notice ${app.ref} failed:`, notice.error)
  }

  // Integrity misses are explained; final answers are never revealed.
  const review = kind === 'integrity' && !attempt.passed
    ? marked.transcript.filter((t) => t.correct === false).map((t) => ({ question: t.question, answer: t.answer, correctAnswer: t.correctAnswer, explanation: t.explanation }))
    : []
  return NextResponse.json({ ok: true, kind, pct: marked.pct, passed: attempt.passed, late, passPct: rules.passPct, review, state })
}
