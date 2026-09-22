/**
 * recruitment.ts: personal assessment codes and the emails around them.
 *
 * Codes replace the one shared code per role. Each is issued to one
 * applicant, tied to their application, works once, and expires after the
 * assessment window. Nothing in it is guessable: 10 characters from a
 * 30-letter alphabet with the look-alike characters (0, O, 1, I, L) removed,
 * so it can be read out over the phone without confusion.
 */

import crypto from 'crypto'
import { Resend } from 'resend'
import { PORTAL_URL, COMPANY, COMPANY_RC } from './offerConfig'
import { getBank } from './assessmentBank'

/** The time allowed for a role's assessment, from the bank, so emails never drift from the test. */
const minutesFor = (role: string) => getBank(role)?.minutes ?? 35

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'GoLive Talent Acquisition <talent.acquisition@golivecompany.com>'

export const ASSESSMENT_WINDOW_DAYS = 14
export const REMINDER_AFTER_DAYS = 7
export const DECLINE_HOLD_HOURS = 48

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ2345679'

export function generateAccessCode(): string {
  const bytes = crypto.randomBytes(10)
  let s = ''
  for (let i = 0; i < 10; i++) s += ALPHABET[bytes[i] % ALPHABET.length]
  return `${s.slice(0, 5)}-${s.slice(5)}`
}

/** Normalise what a candidate typed: case, spaces, and a missing hyphen. */
export function normaliseCode(input: string): string {
  const raw = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return raw.length === 10 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw
}

/** Which assessment page serves a role. Mirrors public/assessment-*.html. */
export const ASSESSMENT_PAGE: Record<string, string> = {
  'Operations Coordinator': '/assessment.html',
  'Social Media & Community Manager': '/assessment-social.html',
  'Hosting Support Technician': '/assessment-hosting.html',
  'Sales & Support Associate': '/assessment-sales.html',
  'Administrative Assistant': '/assessment-admin.html',
  'Full Stack Engineer': '/assessment-engineer.html',
}

const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const first = (name: string) => (name || '').trim().split(/\s+/)[0] || 'Candidate'
const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })

const shell = (inner: string) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
  ${inner}
  <p style="margin-bottom:2px;margin-top:22px">Yours sincerely,</p>
  <p style="margin-top:0"><strong style="color:#0e7c86">Talent Acquisition</strong><br>
  ${esc(COMPANY)}<br><span style="font-size:12px;color:#777">${esc(COMPANY_RC)}</span></p>
</div>`

type Send = { ok: boolean; error?: string }
async function send(
  to: string, subject: string, html: string,
  attachments?: { filename: string; content: Buffer }[]
): Promise<Send> {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html, ...(attachments?.length ? { attachments } : {}) })
    if (error) return { ok: false, error: String(error.message || error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || 'send failed' }
  }
}

/** Sent on application: acknowledgement, personal code, and the link. */
export function sendApplicationReceived(a: {
  name: string; email: string; role: string; ref: string; code: string; expiresAt: Date
}): Promise<Send> {
  const page = ASSESSMENT_PAGE[a.role] || '/assessment.html'
  const url = `${PORTAL_URL}${page}`
  return send(a.email, `Your application for ${a.role}: next step`, shell(`
    <p>Dear ${esc(first(a.name))},</p>
    <p>Thank you for applying for the <strong>${esc(a.role)}</strong> position at ${esc(COMPANY)}. Your application reference is <strong>${esc(a.ref)}</strong>. Please keep it for any correspondence about your application.</p>
    <p>The first stage is an online assessment. It is proctored, so your camera must be on and you will need a laptop or desktop with a working camera in a quiet place. It takes about ${minutesFor(a.role)} minutes, and you may take it at any time before <strong>${esc(fmtDate(a.expiresAt))}</strong>.</p>
    <div style="background:#e8f7fb;border:1px solid #a3dbe9;border-radius:8px;padding:16px;text-align:center;margin:18px 0">
      <p style="margin:0 0 4px;font-size:12px;color:#0b7e9b;font-weight:600">Your access code</p>
      <p style="margin:0;font-size:26px;font-weight:700;letter-spacing:0.12em;color:#0f2a2e">${esc(a.code)}</p>
    </div>
    <p style="margin:18px 0"><a href="${url}" style="display:inline-block;background:#0b7e9b;color:#ffffff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600">Start the assessment</a></p>
    <p style="font-size:13px;color:#555">The code is personal to you, works once, and cannot be shared. You have one attempt. If you are not ready when you open the page, you can close it and return later; the assessment only begins when you click Begin.</p>
    <p style="font-size:13px;color:#555">Candidates who meet the pass mark are reviewed by the Managing Director, and we will write to you with the outcome either way.</p>
  `))
}

/** Sent once, a week in, to applicants who have not started. */
export function sendAssessmentReminder(a: {
  name: string; email: string; role: string; ref: string; code: string; expiresAt: Date
}): Promise<Send> {
  const page = ASSESSMENT_PAGE[a.role] || '/assessment.html'
  return send(a.email, `Reminder: your ${a.role} assessment closes on ${fmtDate(a.expiresAt)}`, shell(`
    <p>Dear ${esc(first(a.name))},</p>
    <p>A week ago you applied for the <strong>${esc(a.role)}</strong> position (reference ${esc(a.ref)}). Our records show the online assessment has not yet been taken.</p>
    <p>It closes on <strong>${esc(fmtDate(a.expiresAt))}</strong>. After that date your application cannot be taken further, so if you are still interested, please set aside about ${minutesFor(a.role)} minutes before then.</p>
    <div style="background:#e8f7fb;border:1px solid #a3dbe9;border-radius:8px;padding:14px;text-align:center;margin:18px 0">
      <p style="margin:0 0 4px;font-size:12px;color:#0b7e9b;font-weight:600">Your access code</p>
      <p style="margin:0;font-size:24px;font-weight:700;letter-spacing:0.12em;color:#0f2a2e">${esc(a.code)}</p>
    </div>
    <p style="margin:18px 0"><a href="${PORTAL_URL}${page}" style="display:inline-block;background:#0b7e9b;color:#ffffff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600">Start the assessment</a></p>
    <p style="font-size:13px;color:#555">If you have decided not to proceed, no action is needed.</p>
  `))
}

/** Sent automatically, after the hold period, to candidates below the pass mark. */
export function sendNotProgressed(a: { name: string; email: string; role: string; ref: string }): Promise<Send> {
  return send(a.email, `Your application for ${a.role} (${a.ref})`, shell(`
    <p>Dear ${esc(first(a.name))},</p>
    <p>Thank you for applying for the <strong>${esc(a.role)}</strong> position at ${esc(COMPANY)} and for completing the online assessment.</p>
    <p>After careful consideration, we will not be taking your application further on this occasion. The position has moved forward with other candidates whose assessment results were a closer match for the role.</p>
    <p>We were grateful for your interest in GoLive, and you are welcome to apply for future positions. Open roles are listed at <a href="${PORTAL_URL}/careers" style="color:#0b7e9b">${PORTAL_URL.replace(/^https?:\/\//, '')}/careers</a>.</p>
    <p style="font-size:13px;color:#555">In line with the Nigeria Data Protection Act 2023 and our Privacy Policy, your assessment data will be deleted in accordance with our retention schedule unless you apply for another role.</p>
  `))
}

/** Internal: tells talent acquisition a new application has arrived, with the CV attached. */
export function sendApplicationNotice(a: {
  name: string; email: string; phone?: string; role: string; ref: string; note?: string
  cv?: { filename: string; content: Buffer }
}): Promise<Send> {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#5c7184;width:130px;vertical-align:top">${k}</td><td style="padding:6px 0;color:#0d2233">${v}</td></tr>`
  return send('talent.acquisition@golivecompany.com', `New application: ${a.name}, ${a.role} (${a.ref})`, `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.6;max-width:620px">
  <p style="margin:0 0 12px"><strong>${esc(a.name)}</strong> has applied for <strong>${esc(a.role)}</strong> through the careers page and has been sent their personal assessment code.</p>
  <table style="width:100%;border-collapse:collapse;font-size:13.5px">
    ${row('Reference', esc(a.ref))}
    ${row('Email', `<a href="mailto:${esc(a.email)}" style="color:#0b7e9b">${esc(a.email)}</a>`)}
    ${a.phone ? row('Phone', esc(a.phone)) : ''}
    ${row('CV', a.cv ? `Attached: ${esc(a.cv.filename)}` : 'Not attached (see the portal)')}
    ${a.note ? row('Their note', esc(a.note).replace(/\n/g, '<br>')) : ''}
  </table>
  <p style="font-size:13px;color:#555;margin-top:14px">No action is needed yet. You will be notified when they submit the assessment, with the outcome against the pass mark. The CV is also available on their record in Candidate assessments.</p>
</div>`, a.cv ? [a.cv] : undefined)
}

/** Candidate: a receipt straight after submission. No score and no outcome yet. */
export function sendAssessmentReceived(a: { name: string; email: string; role: string; ref: string }): Promise<Send> {
  return send(a.email, `We have received your ${a.role} assessment (${a.ref})`, shell(`
    <p>Dear ${esc(first(a.name))},</p>
    <p>Thank you for completing the online assessment for the <strong>${esc(a.role)}</strong> position. Your answers and session recording have been received safely.</p>
    <p>Your result will now be reviewed. We will write to you with the outcome, normally within a few working days. There is nothing further you need to do in the meantime.</p>
    <p style="font-size:13px;color:#555">Please keep your reference, <strong>${esc(a.ref)}</strong>, for any correspondence about your application.</p>
  `))
}
