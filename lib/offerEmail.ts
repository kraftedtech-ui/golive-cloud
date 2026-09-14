/**
 * offerEmail.ts — the three emails of the digital offer flow.
 * All via Resend; candidate-facing mail from GoLive Talent Acquisition.
 */

import { Resend } from 'resend'
import { PORTAL_URL, fmtNaira, fmtDate } from './offerConfig'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'GoLive Talent Acquisition <talent.acquisition@golivecompany.com>'
const REPLY_TO = 'talent.acquisition@golivecompany.com'
const MD_INBOX = 'talent.acquisition@golivecompany.com'

const wrap = (inner: string) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
${inner}
  <p style="margin-bottom:2px">Best regards,</p>
  <p style="margin-top:0"><strong style="color:#0e7c86">GoLive Talent Acquisition</strong><br>
  <span style="font-size:12px;color:#777">The GoLive Digital Solutions Company Ltd &middot; RC1644767<br>
  talent.acquisition@golivecompany.com &middot; <a href="https://golivecompany.com" style="color:#777">golivecompany.com</a></span></p>
</div>`

async function send(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({ from: FROM, reply_to: REPLY_TO, to, subject, html })
    if (error) return { ok: false, error: String(error.message || error) }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'send failed' }
  }
}

export function sendOfferEmail(p: {
  name: string; email: string; role: string; ref: string
  salary: number; startDate: string; deadline: Date; token: string; jobCode: string
}) {
  const firstName = (p.name || '').trim().split(/\s+/)[0] || 'Candidate'
  const link = `${PORTAL_URL}/offer/${p.token}`
  return send(
    p.email,
    `Offer of Employment \u2014 ${p.role} (${p.jobCode}), GoLive Digital Solutions (${p.ref})`,
    wrap(`
  <p>Dear ${firstName},</p>
  <p>Congratulations! Following your interview, we are delighted to extend you a formal <strong>Offer of Employment</strong> for the <strong>${p.role}</strong> position at The GoLive Digital Solutions Company Ltd.</p>
  <p style="margin:14px 0;padding:12px 16px;background:#f0f7f8;border:1px solid #cfe3e5;border-radius:8px">
    <strong>Job Code:</strong> ${p.jobCode} &nbsp;&middot;&nbsp; <strong>Application:</strong> ${p.ref}<br>
    <strong>Salary:</strong> ${fmtNaira(p.salary)} monthly gross<br>
    <strong>Proposed start date:</strong> ${fmtDate(p.startDate)}<br>
    <strong>Offer valid until:</strong> ${fmtDate(p.deadline)}
  </p>
  <p>Your complete offer letter \u2014 including probation terms, governance, and benefits \u2014 is ready for your review and <strong>electronic signature</strong> on our secure portal:</p>
  <p style="text-align:center;margin:22px 0">
    <a href="${link}" style="background:#0e7c86;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:600;display:inline-block">Review &amp; sign your offer</a>
  </p>
  <p>Signing takes two minutes: read the letter, type your full legal name, and submit. Once you sign, the Managing Director countersigns and you will receive the fully executed copy for your records. If any term needs discussion before you sign, simply reply to this email.</p>
  <p>This link is personal to you \u2014 please do not forward it. The offer lapses automatically if unsigned by the date above.</p>
  <p>We are genuinely excited about the prospect of you joining GoLive.</p>`)
  )
}

export function sendCandidateSignedNotice(p: { name: string; ref: string; role: string; signedName: string; ip: string }) {
  return send(
    MD_INBOX,
    `\u2713 Offer signed: ${p.name} \u2014 ${p.role} (${p.ref})`,
    wrap(`
  <p><strong>${p.name}</strong> has electronically signed the offer for <strong>${p.role}</strong> (${p.ref}).</p>
  <p>Signed as: <strong>${p.signedName}</strong> &middot; IP ${p.ip || 'unknown'}</p>
  <p>Next step: open the portal\u2019s Application Tracker and click <strong>Countersign offer</strong> on their card to fully execute it. The candidate is automatically notified once you do.</p>`)
  )
}

export function sendExecutedEmail(p: { name: string; email: string; role: string; ref: string; pdfToken: string }) {
  const firstName = (p.name || '').trim().split(/\s+/)[0] || 'Candidate'
  const pdfLink = `${PORTAL_URL}/api/offer/pdf?token=${encodeURIComponent(p.pdfToken)}`
  return send(
    p.email,
    `Fully executed \u2014 your offer letter, GoLive Digital Solutions (${p.ref})`,
    wrap(`
  <p>Dear ${firstName},</p>
  <p>Welcome to GoLive! \ud83c\udf89 Your offer for the <strong>${p.role}</strong> position has now been countersigned by the Managing Director and is <strong>fully executed</strong>.</p>
  <p style="text-align:center;margin:22px 0">
    <a href="${pdfLink}" style="background:#0e7c86;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:600;display:inline-block">Download your signed offer (PDF)</a>
  </p>
  <p>Please save a copy for your records \u2014 the download link remains valid for 30 days. Before your start date you will receive your onboarding pack: the Role Charter, Employee Handbook, and confidentiality undertaking for countersignature, plus your account setup details.</p>
  <p>We look forward to having you on the team.</p>`)
  )
}
