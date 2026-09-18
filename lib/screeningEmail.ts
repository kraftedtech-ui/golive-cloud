/**
 * screeningEmail.ts — sends the candidate their Background Check International
 * link when screening moves to in progress.
 *
 * Sent from talent.acquisition@, which is the address used for all recruitment
 * correspondence, so the thread stays in one place for the candidate.
 *
 * The message deliberately restates that BCI will also contact them directly
 * and that the offer is conditional on satisfactory checks, because that is
 * what they already consented to in the onboarding acknowledgement, and a
 * screening link arriving with no context reads like a phishing attempt.
 */

import { Resend } from 'resend'
import { COMPANY, COMPANY_RC } from './offerConfig'
import { SCREENING_PROVIDER } from './hireProvisioning'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'GoLive Talent Acquisition <talent.acquisition@golivecompany.com>'

const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function sendScreeningLinkEmail(input: {
  name: string
  email: string
  role?: string
  link: string
  note?: string
}): Promise<{ ok: boolean; error?: string }> {
  const first = String(input.name || '').split(' ')[0]

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.email,
      subject: `Background screening: action needed to complete your onboarding`,
      html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
  <p>Dear ${esc(first)},</p>
  <p>Thank you for completing your onboarding acknowledgement. The next step is your pre-employment background check, which is carried out for us by <strong>${esc(SCREENING_PROVIDER)}</strong>.</p>
  ${input.note ? `<p>${esc(input.note)}</p>` : ''}
  <p>Please use the link below to submit your details directly to them:</p>
  <p style="margin:18px 0">
    <a href="${esc(input.link)}" style="display:inline-block;background:#0e7c86;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13.5px">Start your background check</a>
  </p>
  <p style="font-size:12.5px;color:#666;word-break:break-all">If the button does not work, copy this into your browser:<br>${esc(input.link)}</p>
  <p style="font-size:13px;color:#555">A few things worth knowing:</p>
  <ul style="font-size:13px;color:#555;padding-left:20px;margin-top:4px">
    <li style="margin:4px 0">You may also hear from ${esc(SCREENING_PROVIDER)} directly, which is expected.</li>
    <li style="margin:4px 0">Your engagement remains conditional on satisfactory checks, as set out in your onboarding pack.</li>
    <li style="margin:4px 0">Please complete it promptly. Your portal account and start arrangements follow the clearance.</li>
  </ul>
  <p style="font-size:13px;color:#555">If anything looks unclear or you are unsure whether a message is genuinely from us, reply to this email before entering any details.</p>
  <p style="margin-bottom:2px;margin-top:22px">Best regards,</p>
  <p style="margin-top:0"><strong style="color:#0e7c86">${esc(COMPANY)}</strong><br>
  <span style="font-size:12px;color:#777">${esc(COMPANY_RC)}</span></p>
</div>`,
    })
    if (error) return { ok: false, error: String(error.message || error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || 'send failed' }
  }
}
