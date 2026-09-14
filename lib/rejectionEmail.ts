/**
 * rejectionEmail.ts — sends a formal, courteous rejection letter when an
 * interviewed candidate is moved to "rejected" in the HR panel.
 *
 * Fires once (guarded by rejectionEmailSentAt on the Application).
 * Sent via Resend as GoLive Talent Acquisition; replies land in the
 * talent.acquisition@ shared mailbox.
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'GoLive Talent Acquisition <talent.acquisition@golivecompany.com>'
const REPLY_TO = 'talent.acquisition@golivecompany.com'
const CAREERS_URL = 'https://cloud.golivecompany.com/careers'

export interface RejectionCandidate {
  name: string
  email: string
  role: string
  ref: string
}

export async function sendRejectionEmail(c: RejectionCandidate): Promise<{ ok: boolean; error?: string }> {
  const firstName = (c.name || '').trim().split(/\s+/)[0] || 'Candidate'

  const html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.7;max-width:620px;margin:0 auto">
  <p>Dear ${firstName},</p>

  <p>Thank you for the time and effort you invested in your application for the <strong>${c.role}</strong> position at The GoLive Digital Solutions Company Ltd, from the online assessment through to your interview. We appreciate the professionalism you demonstrated at every stage of the process.</p>

  <p>After careful consideration, we have decided to proceed with another candidate whose experience most closely matched our current requirements. This was a highly competitive process with a strong field of applicants, and our decision is not a reflection of your ability.</p>

  <p>We would be pleased to keep your details on record for future opportunities, and we warmly encourage you to apply again as GoLive grows. Current and future openings, together with their salary ranges, are published on our careers page:</p>

  <p style="text-align:center;margin:18px 0">
    <a href="${CAREERS_URL}" style="color:#0e7c86;font-weight:600">${CAREERS_URL.replace('https://', '')}</a>
  </p>

  <p>In line with the Nigeria Data Protection Act 2023 and our Privacy Policy, your assessment data will be deleted in accordance with our standard retention schedule unless you apply for another role.</p>

  <p>We wish you every success in your career, and we thank you again for your interest in GoLive.</p>

  <p style="margin-bottom:2px">Yours sincerely,</p>
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
