/**
 * issuanceEmail.ts — transactional mail for employee document issuance.
 * Sent from the company address (not talent.acquisition@, which is reserved
 * for recruitment correspondence) because the recipient is already staff.
 */

import { Resend } from 'resend'
import { PORTAL_URL, fmtDate, fmtDateTime, COMPANY, COMPANY_RC } from './offerConfig'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'GoLive Digital Solutions <hello@golivecompany.com>'
const NOTIFY = process.env.NOTIFY_EMAIL || 'contact@golivecompany.com'

const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const shell = (inner: string) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
  ${inner}
  <p style="margin-bottom:2px;margin-top:22px">Best regards,</p>
  <p style="margin-top:0"><strong style="color:#0e7c86">${esc(COMPANY)}</strong><br>
  <span style="font-size:12px;color:#777">${esc(COMPANY_RC)}</span></p>
</div>`

export async function sendIssuanceEmail(input: {
  name: string
  email: string
  title: string
  message?: string
  docLabels: string[]
  deadline?: Date
  token: string
}): Promise<{ ok: boolean; error?: string }> {
  const url = `${PORTAL_URL}/issue/${input.token}`
  const list = input.docLabels
    .map((l) => `<li style="margin:4px 0">${esc(l)}</li>`)
    .join('')

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.email,
      subject: `${input.title} — for your review and signature`,
      html: shell(`
        <p>Dear ${esc(String(input.name).split(' ')[0])},</p>
        <p>${esc(input.title)} ${input.docLabels.length > 1 ? 'and its accompanying documents are' : 'is'} ready for your review and electronic signature.</p>
        ${input.message ? `<p>${esc(input.message)}</p>` : ''}
        <p style="margin-bottom:6px"><strong>Documents:</strong></p>
        <ul style="margin-top:0;padding-left:20px;font-size:13.5px">${list}</ul>
        <p style="margin:18px 0">
          <a href="${url}" style="display:inline-block;background:#0e7c86;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13.5px">Open and sign</a>
        </p>
        <p style="font-size:13px;color:#555">Please download and read each document, confirm each one individually, then sign by typing your full legal name. ${input.deadline ? `This link expires on <strong>${esc(fmtDate(input.deadline))}</strong>.` : ''}</p>
        <p style="font-size:12.5px;color:#777">This link is personal to you. If anything in these documents is unclear, reply to this email before signing rather than after.</p>
      `),
    })
    if (error) return { ok: false, error: String(error.message || error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || 'send failed' }
  }
}

export async function sendIssuanceSignedNotice(input: {
  name: string
  ref: string
  employeeNumber: string
  title: string
  signatureName: string
  signedAt: Date
  ip?: string
  docCount: number
}): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      subject: `Signed: ${input.title} — ${input.name} [${input.ref}]`,
      html: shell(`
        <p><strong>${esc(input.name)}</strong> (${esc(input.employeeNumber)}) has signed <strong>${esc(input.title)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:6px 0;color:#6b7280;width:170px">Documents acknowledged</td><td style="padding:6px 0">${input.docCount}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Signature</td><td style="padding:6px 0">${esc(input.signatureName)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Signed at</td><td style="padding:6px 0">${esc(fmtDateTime(input.signedAt))}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Originating address</td><td style="padding:6px 0">${esc(input.ip || 'unknown')}</td></tr>
        </table>
        <p style="font-size:13px">Countersign it on the employee's card at <a href="${PORTAL_URL}/portal/people" style="color:#0e7c86">People (HR)</a> to complete execution.</p>
      `),
    })
  } catch (e) {
    console.error('[issuance] signed-notice failed:', e)
  }
}
