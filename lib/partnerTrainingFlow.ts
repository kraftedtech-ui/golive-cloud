/**
 * partnerTrainingFlow.ts: the rules and emails for partner training and
 * assessment. SERVER ONLY (imports the question banks via the routes, and Resend).
 *
 * Order enforced on the server, never trusted from the browser:
 *   Module 1  ->  Integrity check (100%, retake at once)  ->  Modules 2, 3, 4 in order
 *   ->  Partner assessment (80%, second attempt no sooner than 7 days after the first).
 * Passing the partner assessment moves the applicant to the Agreement stage.
 */

import { Resend } from 'resend'
import type { IPartnerApplication, IAssessmentAttempt } from '@/models/PartnerApplication'
import { REQUIRED_MODULES, ASSESSMENT_RULES, MODULES } from '@/lib/partnerTraining'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'
import { PORTAL_URL, COMPANY, COMPANY_RC } from '@/lib/offerConfig'
import { signTrainingToken, TRAINING_LINK_DAYS } from '@/lib/partnerToken'
import { UPLOAD_GRACE_MINUTES } from '@/lib/assessmentPaper'

export const TRAINING_OPEN_STAGES = ['training', 'assessment', 'agreement', 'active']

const DAY = 864e5

export type TrainingState = {
  open: boolean
  closedReason?: string
  required: number[]
  completed: Record<number, string>
  /** The module the partner may complete next, or null when all are done. */
  nextModule: number | null
  integrity: { passed: boolean; passedAt?: string; attempts: number; canBegin: boolean; reason?: string }
  final: {
    passed: boolean; passedAt?: string; attempts: number; allowed: number
    canBegin: boolean; reason?: string; availableFrom?: string; lastPct?: number
  }
}

const iso = (d?: Date) => (d ? new Date(d).toISOString() : undefined)

/** Close any paper whose time (plus grace) has run out without a submission. Returns true if anything changed. */
export function closeExpired(app: IPartnerApplication, now = new Date()): boolean {
  let changed = false
  for (const a of app.attempts || []) {
    if (a.submittedAt || a.abandoned) continue
    const end = new Date(a.paper.deadline).getTime() + UPLOAD_GRACE_MINUTES * 60_000
    if (now.getTime() > end) {
      a.abandoned = true
      a.passed = false
      a.pct = 0
      a.submittedAt = new Date(end)
      changed = true
    }
  }
  if (changed) app.markModified('attempts')
  return changed
}

export function openAttempt(app: IPartnerApplication, kind: 'integrity' | 'final'): IAssessmentAttempt | undefined {
  return (app.attempts || []).find((a) => a.kind === kind && !a.submittedAt && !a.abandoned)
}

export function trainingState(app: IPartnerApplication, now = new Date()): TrainingState {
  const required = REQUIRED_MODULES[app.category] || [1, 2, 3, 4]
  const completed: Record<number, string> = {}
  for (const m of app.training?.modules || []) completed[m.no] = iso(m.completedAt) as string

  const done = (kind: 'integrity' | 'final') => (app.attempts || []).filter((a) => a.kind === kind && (a.submittedAt || a.abandoned))
  const integ = done('integrity')
  const integPass = integ.find((a) => a.passed)
  const fin = done('final')
  const finPass = fin.find((a) => a.passed)

  const open = TRAINING_OPEN_STAGES.includes(app.status)
  let closedReason: string | undefined
  if (!open) closedReason = app.status === 'declined' || app.status === 'withdrawn'
    ? 'This application is closed, so training is no longer available.'
    : 'Training opens once your application reaches the training stage.'

  // Next module: Module 1 first; the rest only once the integrity check is passed.
  let nextModule: number | null = null
  for (const no of required) {
    if (completed[no]) continue
    if (no !== 1 && !integPass) { nextModule = null; break }
    nextModule = no
    break
  }

  const integrityState = {
    passed: !!integPass, passedAt: iso(integPass?.submittedAt), attempts: integ.length,
    canBegin: false as boolean, reason: undefined as string | undefined,
  }
  if (!integPass) {
    if (!completed[1]) integrityState.reason = 'Complete Module 1 first.'
    else integrityState.canBegin = true
  }

  const allowed = ASSESSMENT_RULES.final.standardAttempts + (app.extraFinalAttempts || 0)
  const finalState = {
    passed: !!finPass, passedAt: iso(finPass?.submittedAt), attempts: fin.length, allowed,
    canBegin: false as boolean, reason: undefined as string | undefined, availableFrom: undefined as string | undefined,
    lastPct: fin.length ? fin[fin.length - 1].pct : undefined,
  }
  if (!finPass) {
    const allModules = required.every((no) => completed[no])
    if (!integPass || !allModules) finalState.reason = 'Complete every module and the integrity check first.'
    else if (fin.length >= allowed) finalState.reason = `You have used ${fin.length} of ${allowed} attempts. Please contact ${PARTNER_EMAIL}.`
    else if (fin.length > 0) {
      const last = fin[fin.length - 1]
      const lastEnd = new Date(last.submittedAt as Date).getTime()
      const waived = app.finalWaitWaivedAt && new Date(app.finalWaitWaivedAt).getTime() > lastEnd
      const from = lastEnd + ASSESSMENT_RULES.final.retakeAfterDays * DAY
      if (!waived && now.getTime() < from) {
        finalState.reason = 'Your next attempt opens seven days after your last one.'
        finalState.availableFrom = new Date(from).toISOString()
      } else finalState.canBegin = true
    } else finalState.canBegin = true
  }

  if (!open) { integrityState.canBegin = false; finalState.canBegin = false; nextModule = null }
  return { open, closedReason, required, completed, nextModule, integrity: integrityState, final: finalState }
}

/* ------------------------------------------------------------------ emails */

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `GoLive Partner Network <${PARTNER_EMAIL}>`
const NOTIFY = process.env.PARTNERS_NOTIFY || PARTNER_EMAIL
const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const first = (name: string) => (name || '').trim().split(/\s+/)[0] || 'there'
const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })

type Send = { ok: boolean; error?: string }
async function send(to: string, subject: string, html: string): Promise<Send> {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, reply_to: PARTNER_EMAIL, subject, html })
    if (error) return { ok: false, error: String(error.message || error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || 'send failed' }
  }
}
const shell = (inner: string) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
  ${inner}
  <p style="margin-bottom:2px;margin-top:22px">Yours sincerely,</p>
  <p style="margin-top:0"><strong style="color:#0e7c86">GoLive Partner Network</strong><br>
  ${esc(COMPANY)}<br><span style="font-size:12px;color:#777">${esc(COMPANY_RC)}</span></p>
</div>`
const button = (href: string, label: string) =>
  `<p style="margin:18px 0"><a href="${href}" style="display:inline-block;background:#0b7e9b;color:#ffffff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600">${label}</a></p>`

export function trainingLink(ref: string, now = new Date()): { url: string; expires: Date } {
  const expires = new Date(now.getTime() + TRAINING_LINK_DAYS * DAY)
  return { url: `${PORTAL_URL}/partner-training/${signTrainingToken(ref, expires)}`, expires }
}

/** Emails the personal training link and records that it was sent. Caller saves. */
export async function sendTrainingInvite(app: IPartnerApplication, now = new Date()): Promise<Send> {
  const { url, expires } = trainingLink(app.ref, now)
  const required = REQUIRED_MODULES[app.category] || [1, 2, 3, 4]
  const list = MODULES.filter((m) => required.includes(m.no)).map((m) => `<li>${esc(m.title)} (about ${m.minutes} minutes)</li>`).join('')
  const r = await send(app.applicant.email, 'Your GoLive partner training is ready', shell(`
    <p>Dear ${esc(first(app.applicant.name))},</p>
    <p>Your application (${esc(app.ref)}) has moved to the training stage. Your training is online and can be completed at your own pace, in one sitting or several.</p>
    <ol style="padding-left:20px;margin:0 0 10px">${list}</ol>
    <p>After Module 1 there is a short integrity check on anti-bribery, which requires every answer to be correct and may be retaken straight away. After the final module there is a ${ASSESSMENT_RULES.final.minutes}-minute partner assessment, with a pass mark of ${ASSESSMENT_RULES.final.passPct}%.</p>
    <p>No camera or microphone is used. What is monitored during the assessments is explained on screen before you start.</p>
    ${button(url, 'Start your training')}
    <p style="font-size:13px;color:#555">This link is personal to you and works until ${esc(fmtDate(expires))}. If it expires, reply to this email for a new one.</p>
  `))
  if (r.ok) {
    app.training = app.training || { modules: [] }
    if (!app.training.invitedAt) app.training.invitedAt = now
    app.training.lastInviteAt = now
    app.markModified('training')
  }
  return r
}

export function sendFinalResult(app: IPartnerApplication, a: IAssessmentAttempt, availableFrom?: string): Promise<Send> {
  const passMark = ASSESSMENT_RULES.final.passPct
  if (a.passed) {
    return send(app.applicant.email, 'You have passed the GoLive partner assessment', shell(`
      <p>Dear ${esc(first(app.applicant.name))},</p>
      <p>Congratulations. You scored <strong>${a.pct}%</strong> on the partner assessment, against a pass mark of ${passMark}%, and have completed your training.</p>
      <p>The next step is your Independent Sales Partner Agreement, which we will send to you to sign online. Your partner number and your GoLive certificate are issued once the agreement is countersigned.</p>
    `))
  }
  const next = availableFrom ? ` Your next attempt opens on <strong>${esc(fmtDate(new Date(availableFrom)))}</strong>, using the same link.` : ` Please contact ${PARTNER_EMAIL} about next steps.`
  return send(app.applicant.email, 'Your GoLive partner assessment result', shell(`
    <p>Dear ${esc(first(app.applicant.name))},</p>
    <p>Thank you for taking the partner assessment. You scored <strong>${a.pct ?? 0}%</strong>, against a pass mark of ${passMark}%, so it has not been passed on this occasion.${next}</p>
    <p>Reviewing Modules 2 to 4 before your next attempt is the best preparation. A result below the pass mark does not affect any future application.</p>
  `))
}

export function sendFinalNotice(app: IPartnerApplication, a: IAssessmentAttempt): Promise<Send> {
  const i = a.integrity
  return send(NOTIFY, `Partner assessment ${a.passed ? 'passed' : 'not passed'}: ${app.applicant.name} (${a.pct ?? 0}%)`, `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.6;max-width:620px">
  <p><strong>${esc(app.applicant.name)}</strong> (${esc(app.ref)}) has ${a.passed ? '<strong style="color:#0e700e">passed</strong>' : '<strong style="color:#b42318">not passed</strong>'} the partner assessment, attempt ${a.number}, with <strong>${a.pct ?? 0}%</strong>${a.late ? ' (submitted late)' : ''}.</p>
  ${i ? `<p style="margin:0">Integrity log: ${i.tabSwitches} tab switches, ${i.focusLoss} focus losses, ${i.pasteTries} paste and ${i.copyTries} copy attempts, ${Math.round(i.seconds / 60)} minutes.</p>` : ''}
  ${a.passed ? '<p>They have moved to the Agreement stage.</p>' : ''}
  ${button(`${PORTAL_URL}/portal/partners`, 'Open in the portal')}
</div>`)
}
