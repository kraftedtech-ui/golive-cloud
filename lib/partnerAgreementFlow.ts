/**
 * partnerAgreementFlow.ts: send, sign, countersign and certificate issue.
 * SERVER ONLY. Mirrors the offer-letter flow: the partner signs by typing
 * their name on a signed link; the MD countersigns in the portal; the partner
 * number and certificate are minted at countersignature and never before.
 */

import { Resend } from 'resend'
import type { IPartnerApplication } from '@/models/PartnerApplication'
import { AGREEMENT_VERSION, CERT_TITLE, agreementMode, type AgreementView } from '@/lib/partnerAgreement'
import { LINES } from '@/lib/commissionRules'

const UNPUBLISHED = () => LINES.map((l) => ({ line: l.line, basis: l.basis, referral: '[rate]', sales: '[rate]' }))
import { currentSchedule } from '@/lib/commissionSchedule'
import { nextPartnerNumber, nextCertificateNumber, CERT_VALID_MONTHS, verifyUrl, linkedInAddUrl } from '@/lib/partnerCertificate'
import { signPartnerToken } from '@/lib/partnerToken'
import { PARTNER_EMAIL, STAGE_LABELS } from '@/lib/partnerConfig'
import { PORTAL_URL, COMPANY, COMPANY_RC, MD_NAME } from '@/lib/offerConfig'

const DAY = 864e5
export const AGREEMENT_LINK_DAYS = 30

export function agreementView(app: IPartnerApplication): AgreementView {
  const integ = (app.attempts || []).find((a) => a.kind === 'integrity' && a.passed)
  return {
    ref: app.ref,
    category: app.category,
    version: app.agreement?.version || AGREEMENT_VERSION,
    test: !!app.agreement?.test,
    sentAt: app.agreement?.sentAt,
    schedule: app.agreement?.schedule?.length ? app.agreement.schedule : UNPUBLISHED(),
    scheduleVersion: app.agreement?.scheduleVersion,
    scheduleEffectiveAt: app.agreement?.scheduleEffectiveAt,
    partner: {
      name: app.applicant.name, email: app.applicant.email, phone: app.applicant.phone,
      businessName: app.applicant.businessName, cacNumber: app.applicant.cacNumber, tin: app.applicant.tin, applyingAs: app.applicant.applyingAs,
    },
    partnerSignedAt: app.agreement?.partnerSignedAt,
    partnerSignedName: app.agreement?.partnerSignedName,
    partnerIp: app.agreement?.partnerIp,
    mdSignedAt: app.agreement?.mdSignedAt,
    mdSignedName: app.agreement?.mdSignedName,
    partnerNumber: app.partnerNumber,
    assessmentPassedAt: app.assessmentPassedAt,
    integrityPassedAt: integ?.submittedAt,
  }
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
const button = (href: string, label: string, alt = false) =>
  `<a href="${href}" style="display:inline-block;background:${alt ? '#ffffff' : '#0b7e9b'};color:${alt ? '#0b7e9b' : '#ffffff'};border:1px solid #0b7e9b;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;margin:4px 6px 4px 0">${label}</a>`

/* --------------------------------------------------------------- actions */

/** Records and emails the agreement. Caller saves. */
export async function sendAgreement(app: IPartnerApplication, by: string, now = new Date()): Promise<Send & { status?: number }> {
  if (!app.assessmentPassedAt) return { ok: false, status: 409, error: 'The partner assessment has not been passed yet.' }
  if (app.agreement?.mdSignedAt) return { ok: false, status: 409, error: 'The agreement is already fully executed.' }
  const current = await currentSchedule()
  const mode = agreementMode(app.applicant.email, !!current)
  if (!mode.allowed) return { ok: false, status: 409, error: mode.reason }

  // A resend before the partner signs refreshes the terms to the current schedule version.
  if (!app.agreement?.partnerSignedAt) {
    const rows = current ? current.rows.map((r) => ({ line: r.line, basis: r.basis, referral: r.referral, sales: r.sales })) : UNPUBLISHED()
    app.agreement = {
      version: AGREEMENT_VERSION, test: mode.test, sentAt: now, schedule: rows,
      scheduleVersion: current?.version, scheduleEffectiveAt: current?.effectiveAt,
    }
    app.markModified('agreement')
  }
  const expires = new Date(now.getTime() + AGREEMENT_LINK_DAYS * DAY)
  const url = `${PORTAL_URL}/partner-agreement/${signPartnerToken('pagree', app.ref, expires)}`
  const r = await send(app.applicant.email, `${mode.test ? '[TEST] ' : ''}Your GoLive Independent Sales Partner Agreement`, shell(`
    <p>Dear ${esc(first(app.applicant.name))},</p>
    <p>Congratulations on completing your partner training. Your <strong>Independent Sales Partner Agreement</strong> is ready to review and sign online.</p>
    ${mode.test ? '<p style="color:#c50f1f;font-weight:600">This is a TEST agreement for checking the signing process. It is not binding.</p>' : ''}
    <p>Please read it carefully, including the commission schedule. To sign, you type your full name; the date, time and your connection details are recorded as your signature. The agreement takes effect when it is countersigned by the Managing Director, at which point your partner number and certificate are issued.</p>
    <p>${button(url, 'Review and sign the agreement')}</p>
    <p style="font-size:13px;color:#555">This link is personal to you and works until ${esc(fmtDate(expires))}. Questions about any clause can be sent to ${PARTNER_EMAIL} before you sign.</p>
  `))
  if (r.ok) app.timeline.push({ at: now, by, action: `${mode.test ? 'TEST agreement' : 'Agreement'} sent (${AGREEMENT_VERSION}${current ? `, commission schedule version ${current.version}` : ', no schedule published'})` })
  return r
}

export function sendPartnerSignedNotice(app: IPartnerApplication): Promise<Send> {
  return send(NOTIFY, `Partner agreement signed: ${app.applicant.name}, ready to countersign`, `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.6;max-width:620px">
  <p><strong>${esc(app.applicant.name)}</strong> (${esc(app.ref)}) has signed the ${app.agreement?.test ? '<strong>TEST</strong> ' : ''}Independent Sales Partner Agreement as <strong>${esc(app.agreement?.partnerSignedName || '')}</strong>.</p>
  <p>Countersigning in the portal issues their partner number and certificate, and emails them both.</p>
  <p>${button(`${PORTAL_URL}/portal/partners`, 'Countersign in the portal')}</p>
</div>`)
}

/** MD countersignature: mint numbers, issue the certificate, activate. Caller saves, then emails. */
export async function countersign(app: IPartnerApplication, mdName: string, by: string, now = new Date()): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!app.agreement?.partnerSignedAt) return { ok: false, status: 409, error: 'The partner has not signed yet.' }
  if (app.agreement.mdSignedAt) return { ok: false, status: 409, error: 'This agreement is already fully executed.' }
  const test = !!app.agreement.test
  if (!app.partnerNumber) app.partnerNumber = await nextPartnerNumber(test)
  app.agreement.mdSignedAt = now
  app.agreement.mdSignedName = mdName || MD_NAME
  app.markModified('agreement')

  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + CERT_VALID_MONTHS)
  app.certificate = { number: await nextCertificateNumber(test, now), title: CERT_TITLE[app.category], issuedAt: now, expiresAt, test }
  app.markModified('certificate')

  const from = app.status
  app.status = 'active'
  app.timeline.push({ at: now, by, action: `Agreement countersigned. Partner number ${app.partnerNumber} issued` })
  app.timeline.push({ at: now, by: 'system', action: `Certificate ${app.certificate.number} issued, valid until ${fmtDate(expiresAt)}` })
  app.timeline.push({ at: now, by: 'system', action: `Stage: ${STAGE_LABELS[from] || from} to ${STAGE_LABELS.active}` })
  return { ok: true }
}

export function docLinks(app: IPartnerApplication, now = new Date()) {
  const expires = new Date(Math.max(now.getTime() + 365 * DAY, app.certificate ? new Date(app.certificate.expiresAt).getTime() : 0))
  const t = signPartnerToken('pdoc', app.ref, expires)
  return {
    agreementPdf: `${PORTAL_URL}/api/partner-agreement/pdf?token=${encodeURIComponent(t)}`,
    certificatePdf: `${PORTAL_URL}/api/partner-certificate/pdf?token=${encodeURIComponent(t)}`,
  }
}

export function sendExecutedEmail(app: IPartnerApplication): Promise<Send> {
  const c = app.certificate!
  const links = docLinks(app)
  const test = !!c.test
  return send(app.applicant.email, `${test ? '[TEST] ' : ''}Welcome to the GoLive Partner Network, ${first(app.applicant.name)}`, shell(`
    <p>Dear ${esc(first(app.applicant.name))},</p>
    <p>Your Independent Sales Partner Agreement has been countersigned. You are now a <strong>${esc(c.title)}</strong>.</p>
    ${test ? '<p style="color:#c50f1f;font-weight:600">TEST: this agreement and certificate are not valid.</p>' : ''}
    <table style="border-collapse:collapse;font-size:14px;margin:6px 0 14px">
      <tr><td style="padding:3px 14px 3px 0;color:#666">Partner number</td><td><strong>${esc(app.partnerNumber || '')}</strong></td></tr>
      <tr><td style="padding:3px 14px 3px 0;color:#666">Certificate</td><td><strong>${esc(c.number)}</strong>, valid until ${esc(fmtDate(new Date(c.expiresAt)))}</td></tr>
    </table>
    <p>${button(links.certificatePdf, 'Download your certificate')}${button(links.agreementPdf, 'Download the signed agreement', true)}</p>
    <p>Anyone can confirm your certificate is current at <a href="${verifyUrl(c.number)}" style="color:#0b7e9b">${esc(verifyUrl(c.number).replace(/^https:\/\//, ''))}</a>, which is also the QR code on the certificate.</p>
    ${test ? '' : `<p>${button(linkedInAddUrl(c), 'Add the certificate to LinkedIn', true)}</p>
    <p style="font-size:13px;color:#555">The LinkedIn button opens LinkedIn&rsquo;s own form, already filled in. Nothing is posted until you save it.</p>`}
    <p>Before approaching any new organisation, register it with us at ${PARTNER_EMAIL}; your partner dashboard, where you will register and track opportunities yourself, follows shortly. Organisations confirmed as registered to you during your application are already held for you.</p>
    <p style="font-size:13px;color:#555">Please keep these download links; they work for a year. Describe yourself only as a &ldquo;${esc(c.title)}&rdquo;, never as certified by or partnered with any vendor.</p>
  `))
}
