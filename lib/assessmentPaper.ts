/**
 * assessmentPaper.ts: issuing, presenting and marking a candidate's paper.
 *
 * A paper is the exact set of questions one candidate received, in order,
 * with the option order they saw. It is stored on the Application when the
 * candidate clicks Begin, so:
 *   - reloading the page returns the same paper, not a fresh draw;
 *   - the deadline runs from issue, on the server, not from a browser timer;
 *   - marking maps each displayed option back to the bank's original option,
 *     so shuffled options can never be marked against the wrong key.
 *
 * Everything here is pure (no database, no request objects), which is what
 * lets it be tested in isolation.
 */

import type { BankQuestion, RoleBank } from '@/lib/assessmentBank'

export type PaperItem = {
  id: string
  /** Display position -> original option index. Absent for tf and text. */
  order?: number[]
}

export type Paper = {
  version: string
  items: PaperItem[]
  issuedAt: string     // ISO
  deadline: string     // ISO: issuedAt + minutes
}

/** What the browser receives. No answers, no explanations. */
export type PublicQuestion = {
  id: string
  sec: string
  type: 'mcq' | 'tf' | 'text'
  text: string
  opts?: string[]
  sub?: string
  placeholder?: string
}

/** Minutes of grace after the deadline, for the recording upload itself. */
export const UPLOAD_GRACE_MINUTES = 5

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Draw a paper. Marked questions are drawn at random when the bank sets a
 * draw size; written questions are always included. Questions keep their bank
 * order so sections stay together; only the choice of questions and the order
 * of options within each multiple-choice question are randomised.
 */
export function issuePaper(bank: RoleBank, now: Date = new Date(), rand: () => number = Math.random): Paper {
  const marked = bank.questions.filter((q) => q.type !== 'text')
  let chosen: Set<string>
  if (bank.draw && bank.draw < marked.length) {
    chosen = new Set(shuffled(marked, rand).slice(0, bank.draw).map((q) => q.id))
  } else {
    chosen = new Set(marked.map((q) => q.id))
  }

  const items: PaperItem[] = bank.questions
    .filter((q) => q.type === 'text' || chosen.has(q.id))
    .map((q) => (q.type === 'mcq' && q.opts
      ? { id: q.id, order: shuffled(q.opts.map((_, i) => i), rand) }
      : { id: q.id }))

  const deadline = new Date(now.getTime() + bank.minutes * 60_000)
  return { version: bank.version, items, issuedAt: now.toISOString(), deadline: deadline.toISOString() }
}

/** The paper as the candidate sees it: questions in order, options reordered, no answers. */
export function publicPaper(bank: RoleBank, paper: Paper): PublicQuestion[] {
  const byId = new Map(bank.questions.map((q) => [q.id, q]))
  return paper.items.map((it) => {
    const q = byId.get(it.id) as BankQuestion
    const out: PublicQuestion = { id: q.id, sec: q.sec, type: q.type, text: q.text }
    if (q.type === 'mcq' && q.opts) out.opts = (it.order || q.opts.map((_, i) => i)).map((i) => q.opts![i])
    // Presentation only; neither reveals an answer.
    if (q.sub) out.sub = q.sub
    if (q.placeholder) out.placeholder = q.placeholder
    return out
  })
}

export type TranscriptRow = {
  number: number
  section: string
  type: 'mcq' | 'tf' | 'text'
  question: string
  answer: string
  correct: boolean | null
  correctAnswer: string | null
  explanation: string | null
}

/**
 * Mark a submission against the bank.
 *
 * answers:     question id -> DISPLAYED option index (mcq) or 'True'/'False' (tf)
 * textAnswers: question id -> free text
 *
 * Anything not on the issued paper is ignored, so a candidate cannot add
 * questions they were not given. Returns the score and the transcript in the
 * shape the portal's transcript view already reads.
 */
export function markPaper(
  bank: RoleBank,
  paper: Paper,
  answers: Record<string, unknown>,
  textAnswers: Record<string, unknown>
): { got: number; max: number; pct: number; transcript: TranscriptRow[] } {
  const byId = new Map(bank.questions.map((q) => [q.id, q]))
  let got = 0
  let max = 0
  const transcript: TranscriptRow[] = paper.items.map((it, i) => {
    const q = byId.get(it.id) as BankQuestion
    const raw = answers[q.id]

    if (q.type === 'text') {
      return {
        number: i + 1, section: q.sec, type: q.type, question: q.text,
        answer: typeof textAnswers[q.id] === 'string' ? (textAnswers[q.id] as string).slice(0, 5000) : '',
        correct: null, correctAnswer: null, explanation: q.explain || null,
      }
    }

    max++
    if (q.type === 'tf') {
      const ans = raw === 'True' || raw === 'False' ? raw : null
      const ok = ans !== null && ans === q.correct
      if (ok) got++
      return {
        number: i + 1, section: q.sec, type: q.type, question: q.text,
        answer: ans || 'No answer', correct: ok,
        correctAnswer: String(q.correct), explanation: q.explain || null,
      }
    }

    // mcq: map the displayed position back to the bank's original option
    const shown = typeof raw === 'number' && Number.isInteger(raw) ? raw : null
    const order = it.order || (q.opts || []).map((_, j) => j)
    const original = shown !== null && shown >= 0 && shown < order.length ? order[shown] : null
    const ok = original !== null && original === q.correct
    if (ok) got++
    return {
      number: i + 1, section: q.sec, type: q.type, question: q.text,
      answer: original !== null && q.opts ? q.opts[original] : 'No answer',
      correct: ok,
      correctAnswer: q.opts && typeof q.correct === 'number' ? q.opts[q.correct] : null,
      explanation: q.explain || null,
    }
  })
  return { got, max, pct: max ? Math.round((got / max) * 100) : 0, transcript }
}

/** Seconds left on a paper, never negative. */
export function secondsLeft(paper: Paper, now: Date = new Date()): number {
  return Math.max(0, Math.floor((new Date(paper.deadline).getTime() - now.getTime()) / 1000))
}

/** A submission is late if it arrives after the deadline plus upload grace. */
export function isLate(paper: Paper, now: Date = new Date()): boolean {
  return now.getTime() > new Date(paper.deadline).getTime() + UPLOAD_GRACE_MINUTES * 60_000
}
