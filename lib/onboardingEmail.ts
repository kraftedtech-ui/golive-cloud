/**
 * onboardingEmail.ts — the onboarding-pack email (with the Background Check
 * International notice) and the admin acknowledgement notice.
 */

import { Resend } from 'resend'
import { PORTAL_URL, fmtDate } from './offerConfig'

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

export function sendOnboardingPackEmail(p: {
  name: string; email: string; role: string; ref: string
  employeeNumber?: string; docLabels: string[]; deadline: Date; token: string
}) {
  const firstName = (p.name || '').trim().split(/\s+/)[0] || 'Colleague'
  const link = `${PORTAL_URL}/onboarding/${p.token}`
  const docList = p.docLabels.map((d) => `<li>${d}</li>`).join('')
  return send(
    p.email,
    `Your onboarding pack \u2014 ${p.role}, GoLive Digital Solutions${p.employeeNumber ? ` (${p.employeeNumber})` : ''}`,
    wrap(`
  <p>Dear ${firstName},</p>
  <p>Welcome aboard! Ahead of your start date, your onboarding pack is ready on our secure portal. ${p.employeeNumber ? `Your employee number is <strong>${p.employeeNumber}</strong> \u2014 it will appear on your employment records going forward.` : ''}</p>
  <p>The pack contains the following documents for you to read and acknowledge:</p>
  <ul style="margin:8px 0 14px;padding-left:22px">${docList}</ul>
  <p style="text-align:center;margin:22px 0">
    <a href="${link}" style="background:#0e7c86;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:600;display:inline-block">Open your onboarding pack</a>
  </p>
  <p>Please download each document, read it carefully, and complete the acknowledgement on the same page by <strong>${fmtDate(p.deadline)}</strong>. Bring any questions to your first-day induction \u2014 nothing here is a trick, but everything here matters.</p>
  <p style="margin:14px 0;padding:12px 16px;background:#fff8ec;border:1px solid #f0d9a8;border-radius:8px">
    <strong>Pre-employment screening \u2014 please read.</strong> As part of onboarding, GoLive conducts background verification through our screening partner, <strong>Background Check International (BCI)</strong>. You will receive correspondence directly from BCI regarding identity, education, and employment-history checks \u2014 this is legitimate and expected, and we ask that you respond to them promptly so your start date is not delayed. As stated in your offer letter, employment remains conditional on satisfactory completion of these checks. Your data is shared with BCI strictly for this purpose, in line with the Nigeria Data Protection Act 2023 and our Privacy Policy.
  </p>
  <p>This link is personal to you \u2014 please do not forward it.</p>
  <p>We are looking forward to your first day.</p>`)
  )
}

export function sendOnboardingAckNotice(p: {
  name: string; ref: string; role: string; employeeNumber?: string
  ackName: string; ip: string; bci: boolean; docCount: number
}) {
  return send(
    MD_INBOX,
    `\u2713 Onboarding acknowledged: ${p.name} \u2014 ${p.role} (${p.employeeNumber || p.ref})`,
    wrap(`
  <p><strong>${p.name}</strong> (${p.employeeNumber || 'no employee number'} \u00b7 ${p.ref}) has completed their onboarding acknowledgement for <strong>${p.role}</strong>.</p>
  <p>Signed as: <strong>${p.ackName}</strong> &middot; IP ${p.ip || 'unknown'}<br>
  Documents acknowledged: ${p.docCount} &middot; BCI screening consent: <strong>${p.bci ? 'GIVEN' : 'NOT GIVEN'}</strong></p>
  <p>Next steps: initiate the BCI check, create their M365 account, and schedule Day-1 induction per the Role Charter checklist.</p>`)
  )
}
