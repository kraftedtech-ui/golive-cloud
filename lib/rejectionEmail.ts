/**
 * rejectionEmail.ts — sends a polite rejection letter when an interviewed
 * candidate is moved to "rejected" in the HR panel.
 *
 * Fires once (guarded by rejectionEmailSentAt on the Application).
 * Sent via Resend as GoLive Talent Acquisition; replies land in the
 * talent.acquisition@ shared mailbox.
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'GoLive Talent Acquisition <talent.acquisition@golivecompany.com>'
const REPLY_TO = 'talent.acquisition@golivecompany.com'

export interface RejectionCandidate {
  name: string
  email: string
  role: string
  ref: string
}

export async function sendRejectionEmail(c: RejectionCandidate): Promise<{ ok: boolean; error?: string }> {
  const firstName = (c.name || '').trim().split(/\s+/)[0] || 'Candidate'

  const html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
  <p>Dear ${firstName},</p>

  <p>Thank you for the time and care you invested in your application for the <strong>${c.role}</strong> position at The GoLive Digital Solutions Company Ltd \u2014 from the assessment through to your interview. We know the process asked a lot of you, and we genuinely appreciate how you showed up for it.</p>

  <p>After careful consideration, we have decided to move forward with another candidate whose experience most closely matched our current needs. This was a competitive process with a strong field, and this decision is not a reflection of your ability \u2014 several capable people could not all fill one seat.</p>

  <p>We would be glad to keep your details in view for future openings, and you are warmly encouraged to apply again as GoLive grows \u2014 we expect to hire across several roles in the coming year. In line with the Nigeria Data Protection Act 2023 and our Privacy Policy, your assessment data will be deleted under our standard retention schedule unless you apply for another role.</p>

  <p>We wish you every success in your search, and thank you again for considering GoLive.</p>

  <p style="margin-bottom:2px">Warm regards,</p>
  <p style="margin-top:0">
    <strong style="color:#0e7c86">GoLive Talent Acquisition</strong><br>
    <span style="font-size:12px;color:#777">
      The GoLive Digital Solutions Company Ltd &middot; RC1644767<br>
      talent.acquisition@golivecompany.com &middot; <a href="https://golivecompany.com" style="color:#777">golivecompany.com</a>
    </span>
  </p>
</div>`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      reply_to: REPLY_TO,
      to: c.email,
      subject: `Your application for ${c.role} \u2014 GoLive Digital Solutions (${c.ref})`,
      html,
    })
    if (error) return { ok: false, error: String(error.message || error) }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'send failed' }
  }
}
