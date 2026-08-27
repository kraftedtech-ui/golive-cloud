/**
 * shortlistEmail.ts — sends the interview invitation when a candidate is
 * moved to "shortlisted" in the HR panel.
 *
 * Sends via Resend as GoLive Talent Acquisition. Replies land in the
 * talent.acquisition@ shared mailbox (private to the MD).
 *
 * Returns true on success. Never throws — the status change must not be
 * rolled back by an email failure; the caller surfaces the result instead.
 */

import { Resend } from 'resend'
import { SHORTLIST, fmtNaira } from './shortlistConfig'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'GoLive Talent Acquisition <talent.acquisition@golivecompany.com>'
const REPLY_TO = 'talent.acquisition@golivecompany.com'

export interface ShortlistCandidate {
  name: string
  email: string
  role: string
  ref: string
}

export async function sendShortlistEmail(c: ShortlistCandidate): Promise<{ ok: boolean; error?: string }> {
  const cfg = SHORTLIST[c.role]
  if (!cfg) return { ok: false, error: `No shortlist config for role "${c.role}"` }
  if (cfg.booking.includes('REPLACE-'))
    return { ok: false, error: `Booking link not configured for "${c.role}" — edit lib/shortlistConfig.ts` }

  const firstName = (c.name || '').trim().split(/\s+/)[0] || 'Candidate'
  const range = `${fmtNaira(cfg.lower)} \u2013 ${fmtNaira(cfg.upper)} monthly gross`
  const commissionLine = cfg.commission
    ? `<p style="margin:8px 0 0">Base salary is complemented by a performance-based commission and bonus structure, which will be discussed at interview.</p>`
    : ''

  const html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
  <p>Dear ${firstName},</p>

  <p>Thank you for completing the online assessment for the <strong>${c.role}</strong> position at The GoLive Digital Solutions Company Ltd. We were impressed with your performance, and I am pleased to inform you that you have been <strong>shortlisted for the interview stage</strong>.</p>

  <p>Your application reference: <strong>${c.ref}</strong></p>

  <p>The next step is a <strong>45-minute video interview</strong>, conducted via Microsoft Teams. Please choose a time that works for you using the booking link below:</p>

  <p style="text-align:center;margin:22px 0">
    <a href="${cfg.booking}" style="background:#0e7c86;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:600;display:inline-block">Book your interview</a>
  </p>

  <p>Once you select a slot, you will automatically receive a calendar invitation containing your Microsoft Teams meeting link. There is nothing to install &mdash; the meeting opens in your browser, though the Teams app is recommended for the best experience.</p>

  <p style="font-weight:600;margin-bottom:4px">Compensation</p>
  <p style="margin-top:0">For transparency, the indicative salary range for this role is <strong>${range}</strong>, with placement within the range determined by experience and interview outcome.</p>
  ${commissionLine}

  <p style="font-weight:600;margin-bottom:4px">To help you prepare</p>
  <ul style="margin-top:0;padding-left:20px">
    <li>Please book a slot within the next 5 working days. If none of the available times work for you, reply to this email and we will find an alternative.</li>
    <li>Join from a quiet location with a stable internet connection and your camera on.</li>
    <li>The interview will cover your assessment responses, your practical experience, and the role itself &mdash; no additional preparation materials are required.</li>
    <li>Have any questions about the role or GoLive ready; the final part of the interview is yours.</li>
  </ul>

  <p style="font-weight:600;margin-bottom:4px">Your data &mdash; retention and deletion</p>
  <p style="margin-top:0;font-size:13px;color:#555">In line with the Nigeria Data Protection Act 2023 and our Privacy Policy, your assessment data &mdash; including your responses, score, and session recording &mdash; is retained for 60 days from the date of your assessment submission, after which it is automatically and permanently deleted from our systems. While your application is actively progressing, deletion is deferred until the process concludes. If your application progresses to an offer of employment, relevant records will instead be retained as part of your employment file. You may request earlier deletion of your data at any time by writing to talent.acquisition@golivecompany.com, though please note this will withdraw your application from the process. Our full Privacy Policy is available at <a href="https://cloud.golivecompany.com/privacy" style="color:#0e7c86">cloud.golivecompany.com/privacy</a>.</p>

  <p>If you are no longer interested in the position, we would appreciate a brief reply so we can plan accordingly.</p>

  <p>We look forward to speaking with you.</p>

  <p style="margin-bottom:2px">Best regards,</p>
  <p style="margin-top:0">
    <strong style="color:#0e7c86">GoLive Talent Acquisition</strong><br>
    <span style="font-size:12px;color:#777">
      The GoLive Digital Solutions Company Ltd &middot; RC1644767<br>
      7 Ibiyinka Olorunbe Close, Victoria Island, Lagos<br>
      talent.acquisition@golivecompany.com &middot; <a href="https://golivecompany.com" style="color:#777">golivecompany.com</a>
    </span>
  </p>
</div>`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      reply_to: REPLY_TO,
      to: c.email,
      subject: `You've been shortlisted \u2014 ${c.role}, GoLive Digital Solutions (${c.ref})`,
      html,
    })
    if (error) return { ok: false, error: String(error.message || error) }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'send failed' }
  }
}
