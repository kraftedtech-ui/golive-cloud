/**
 * offerLetter.ts — builds the offer letter as HTML, shared by the public
 * signing page and the PDF route. Mirrors the company's docx offer template
 * (goLive wordmark, teal rule, REF# job-code line, sections 1\u20139), with
 * digital-signature audit blocks in place of wet-ink lines.
 */

import { MD_NAME, MD_TITLE, COMPANY, COMPANY_RC, fmtNaira, fmtDate, fmtDateTime } from './offerConfig'

export interface OfferView {
  ref: string
  name: string
  email: string
  role: string
  jobCode: string
  salary: number
  startDate: string
  deadline?: Date | string | null
  sentAt?: Date | string | null
  candidateSignedAt?: Date | string | null
  candidateSignedName?: string | null
  candidateIp?: string | null
  mdSignedAt?: Date | string | null
  mdSignedName?: string | null
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildOfferHtml(o: OfferView): string {
  const annual = o.salary * 12
  const candBlock = o.candidateSignedAt
    ? `<div class="sigbox signed">\u2713 Digitally signed by <strong>${esc(o.candidateSignedName)}</strong> on ${fmtDateTime(o.candidateSignedAt)}${o.candidateIp ? ` &middot; IP ${esc(o.candidateIp)}` : ''}</div>`
    : `<div class="sigbox pending">Awaiting candidate signature${o.deadline ? ` &mdash; this offer lapses on ${fmtDate(o.deadline)}` : ''}</div>`
  const mdBlock = o.mdSignedAt
    ? `<div class="sigbox signed">\u2713 Countersigned for the Company by <strong>${esc(o.mdSignedName || MD_NAME)}</strong> \u2014 ${MD_TITLE}, on ${fmtDateTime(o.mdSignedAt)}</div>`
    : `<div class="sigbox pending">To be countersigned by the Company upon acceptance</div>`

  return `
<style>
  .offer * { box-sizing: border-box; }
  .offer { font-family: Arial, 'Segoe UI', sans-serif; font-size: 10.5pt; color: #2d3436; line-height: 1.55; }
  .offer .wordmark { font-size: 17pt; font-weight: 700; margin-bottom: 2px; }
  .offer .wordmark .go { color: #0e7c86; } .offer .wordmark .co { color: #6b7280; font-weight: 400; font-size: 10pt; }
  .offer .rule { border-bottom: 3px solid #0e7c86; margin: 4px 0 18px; }
  .offer h1 { text-align: center; color: #0e7c86; font-size: 16pt; margin: 6px 0 2px; }
  .offer .jobcode { text-align: center; color: #6b7280; font-style: italic; font-size: 9.5pt; margin-bottom: 18px; }
  .offer h2 { color: #0e7c86; font-size: 11.5pt; margin: 16px 0 5px; }
  .offer table.info { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 4px 0 8px; }
  .offer table.info td { border: 1px solid #cbd5d8; padding: 5px 8px; }
  .offer table.info td.k { background: #f0f7f8; font-weight: 700; color: #6b7280; width: 32%; }
  .offer p { margin: 0 0 9px; }
  .offer .sigbox { border-radius: 6px; padding: 9px 12px; font-size: 9.5pt; margin: 6px 0 14px; }
  .offer .sigbox.signed { background: #eef8f0; border: 1px solid #b7e0c1; color: #1a5c2a; }
  .offer .sigbox.pending { background: #fff8ec; border: 1px solid #f0d9a8; color: #7a5b00; }
  .offer .muted { color: #6b7280; font-size: 8.5pt; font-style: italic; }
</style>
<div class="offer">
  <div class="wordmark"><span class="go">go</span>live <span class="co">&nbsp;|&nbsp; ${COMPANY}</span></div>
  <div class="rule"></div>

  <h1>OFFER OF EMPLOYMENT</h1>
  <div class="jobcode">Job Code: ${esc(o.jobCode)} &nbsp;|&nbsp; ${esc(o.role)} &nbsp;|&nbsp; Application ${esc(o.ref)}</div>

  <p>Date: <strong>${fmtDate(o.sentAt || new Date())}</strong> &nbsp;&middot;&nbsp; Private &amp; Confidential</p>
  <p><strong>${esc(o.name)}</strong><br>${esc(o.email)}</p>

  <p>Dear ${esc((o.name || '').trim().split(/\\s+/)[0] || 'Candidate')},</p>
  <p>Following your application (reference <strong>${esc(o.ref)}</strong>), assessment, and interview, we are pleased to offer you employment with <strong>${COMPANY}</strong> (${COMPANY_RC}, the &ldquo;Company&rdquo;) on the terms below.</p>

  <h2>1. Position and Commencement</h2>
  <table class="info">
    <tr><td class="k">Position</td><td>${esc(o.role)}</td></tr>
    <tr><td class="k">Job Code</td><td>${esc(o.jobCode)}</td></tr>
    <tr><td class="k">Department</td><td>Per your Role Charter \u2014 serving all Company arms (GoLive Naija, GoLive Forge, B2B Services)</td></tr>
    <tr><td class="k">Reports to</td><td>${MD_TITLE}</td></tr>
    <tr><td class="k">Start date</td><td><strong>${fmtDate(o.startDate)}</strong></td></tr>
    <tr><td class="k">Work location</td><td>Lagos &middot; hybrid per Company policy</td></tr>
    <tr><td class="k">Hours</td><td>Monday to Friday, 9:00\u201317:00 (WAT), with flexibility as operations reasonably require</td></tr>
  </table>

  <h2>2. Remuneration</h2>
  <p>Your salary will be <strong>${fmtNaira(o.salary)} per month gross</strong> (annualised ${fmtNaira(annual)}), paid monthly in arrears by bank transfer, less statutory deductions (PAYE and applicable contributions). Salary is reviewed at confirmation of employment and annually thereafter; a review is not a guarantee of an increase. Commission or bonus arrangements apply only where a separately signed addendum provides for them.</p>

  <h2>3. Probation and Confirmation</h2>
  <p>Your employment begins with a <strong>90-day probationary period</strong>, during which either party may terminate with 7 days\u2019 written notice. Confirmation as a direct employee is by written notice from the Company following a review at or before the end of probation, assessed against your Role Charter \u2014 including the governance and authority boundaries it sets. Confirmation is not automatic.</p>

  <h2>4. Duties and Governance</h2>
  <p>Your duties, authority limits, systems access, reporting cadence, and probation milestones are set out in your <strong>Role Charter &amp; Governance Pack</strong>, which you will countersign on or before your start date and which forms part of your terms of engagement. For clarity: this role carries no authority to sign contracts or bind the Company to any obligation, regardless of urgency, unless your Role Charter expressly provides otherwise.</p>

  <h2>5. Confidentiality and Data Protection</h2>
  <p>You will sign a confidentiality and data-handling undertaking on or before your start date. Your obligations regarding Company and client information, and personal data under the Nigeria Data Protection Act 2023, are set out there and in the Employee Handbook, and survive the end of your employment.</p>

  <h2>6. Leave and Benefits</h2>
  <p>You are entitled to leave and benefits as set out in the Employee Handbook, including annual leave after confirmation (pro-rated in year one), sick leave, and gazetted public holidays.</p>

  <h2>7. Notice After Confirmation</h2>
  <p>Following confirmation, employment may be ended by either party giving one month\u2019s written notice, or by the Company paying salary in lieu.</p>

  <h2>8. Governing Documents</h2>
  <p>This offer should be read together with: (a) your Role Charter &amp; Governance Pack; (b) the Employee Handbook; and (c) the confidentiality and data-handling undertaking. Where this letter and the Handbook differ, this letter prevails; where the Role Charter is stricter, the Charter prevails for your role.</p>

  <h2>9. Acceptance and Electronic Signature</h2>
  <p>This offer ${o.deadline ? `remains open until <strong>${fmtDate(o.deadline)}</strong>, after which it lapses` : 'remains open until the stated deadline'}. By signing electronically below, you accept the offer on these terms, and the parties agree that electronic signatures on this letter are valid and binding.</p>

  <h2>Signatures</h2>
  <p><strong>Candidate \u2014 ${esc(o.name)}</strong></p>
  ${candBlock}
  <p><strong>For ${COMPANY}</strong> \u2014 ${MD_NAME}, ${MD_TITLE}</p>
  ${mdBlock}

  <p class="muted">Electronic signature record maintained by the GoLive Cloud Portal. ${COMPANY} \u00b7 ${COMPANY_RC}. This letter supersedes all prior discussions regarding the terms of this role.</p>
</div>`
}
