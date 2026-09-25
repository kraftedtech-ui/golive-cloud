import { NextRequest, NextResponse } from 'next/server'
import { loadByToken } from './_load'
import { closeExpired, trainingState, openAttempt } from '@/lib/partnerTrainingFlow'
import { bankFor } from '@/lib/partnerAssessmentBank'
import { publicPaper, secondsLeft, type Paper } from '@/lib/assessmentPaper'

export const dynamic = 'force-dynamic'

/**
 * Partner (token): everything the training page needs. Returns a paper in
 * progress, if any, so a reload resumes the same questions on the same clock.
 */
export async function GET(req: NextRequest) {
  const app = await loadByToken(req.nextUrl.searchParams.get('token'))
  if (!app) return NextResponse.json({ error: 'This training link is not valid or has expired. Email partners@golivecompany.com for a new one.' }, { status: 401 })
  if (closeExpired(app)) await app.save()

  const state = trainingState(app)
  let inProgress = null
  for (const kind of ['integrity', 'final'] as const) {
    const a = openAttempt(app, kind)
    if (a) {
      const paper = a.paper as Paper
      inProgress = { kind, number: a.number, questions: publicPaper(bankFor(kind), paper), secondsLeft: secondsLeft(paper) }
      break
    }
  }
  // The last integrity result is shown with explanations, so a partner can learn from a miss.
  const lastIntegrity = [...(app.attempts || [])].reverse().find((a) => a.kind === 'integrity' && a.submittedAt)
  const integrityReview = lastIntegrity && !lastIntegrity.passed
    ? (lastIntegrity.transcript as { question: string; answer: string; correct: boolean | null; correctAnswer: string | null; explanation: string | null }[] || [])
        .filter((t) => t.correct === false)
        .map((t) => ({ question: t.question, answer: t.answer, correctAnswer: t.correctAnswer, explanation: t.explanation }))
    : []

  return NextResponse.json({
    ref: app.ref,
    name: app.applicant.name,
    category: app.category,
    state,
    inProgress,
    integrityLast: lastIntegrity ? { pct: lastIntegrity.pct, passed: !!lastIntegrity.passed, abandoned: !!lastIntegrity.abandoned } : null,
    integrityReview,
  })
}
