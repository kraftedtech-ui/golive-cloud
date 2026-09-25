/**
 * partnerAgreement.ts: the GoLive Independent Sales Partner Agreement.
 *
 * One document for both categories; clause 2 states which one the partner is
 * appointed to. Rendered as HTML for the signing page and the PDF, like the
 * offer letter (lib/offerLetter.ts), with the same digital signature blocks.
 *
 * ---------------------------------------------------------------------------
 * BEFORE SENDING TO REAL PARTNERS
 * 1. Fill in COMMISSION_SCHEDULE with the confirmed rates.
 * 2. Set RATES_CONFIRMED = true.
 * 3. Have Elthon Partners review the clauses below.
 * Until RATES_CONFIRMED is true, an agreement can only be sent to an email
 * address listed in the PARTNER_AGREEMENT_TEST_EMAILS environment variable
 * (comma-separated). Those are marked TEST, are not binding, and mint test
 * numbers (GL-PTR-T..., GL-CERT-TEST-...) that never use up a real one.
 * ---------------------------------------------------------------------------
 */

import { MD_NAME, MD_TITLE, COMPANY, COMPANY_RC, fmtDate, fmtDateTime } from './offerConfig'

export const AGREEMENT_VERSION = 'PSA-2026-v1'
export const RATES_CONFIRMED = false

/** Rates are strings so they can say exactly what applies, for example "10% of first-year value". */
export const COMMISSION_SCHEDULE: { line: string; basis: string; referral: string; sales: string }[] = [
  { line: 'Microsoft 365 and cloud subscriptions', basis: 'First-year subscription value', referral: '[rate]', sales: '[rate]' },
  { line: 'Microsoft 365 and cloud subscriptions', basis: 'Renewals, years 2 and 3, while the account is retained', referral: '[rate]', sales: '[rate]' },
  { line: 'Odoo licences', basis: 'First-year licence value', referral: '[rate]', sales: '[rate]' },
  { line: 'Implementation, custom software and project services', basis: 'Fees received for the project', referral: '[rate]', sales: '[rate]' },
  { line: 'Managed IT and support contracts', basis: 'First-year contract value', referral: '[rate]', sales: '[rate]' },
  { line: 'Web hosting, domains and websites', basis: 'First-year value', referral: '[rate]', sales: '[rate]' },
  { line: 'Digital Archive and document management', basis: 'Build and first-year licence value', referral: '[rate]', sales: '[rate]' },
]

export function testEmails(): string[] {
  return String(process.env.PARTNER_AGREEMENT_TEST_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

/** Whether an agreement may be sent to this applicant now, and if so whether it is a test. */
export function agreementMode(email: string): { allowed: boolean; test: boolean; reason?: string } {
  if (RATES_CONFIRMED) return { allowed: true, test: false }
  if (testEmails().includes(String(email || '').toLowerCase())) return { allowed: true, test: true }
  return { allowed: false, test: false, reason: 'The commission rates are not confirmed yet. Fill in COMMISSION_SCHEDULE in lib/partnerAgreement.ts and set RATES_CONFIRMED to true, or add this applicant\u2019s email to PARTNER_AGREEMENT_TEST_EMAILS to send a test agreement.' }
}

export const CERT_TITLE = { referral: 'GoLive Accredited Referral Partner', sales: 'GoLive Accredited Sales Partner' } as const

export interface AgreementView {
  ref: string
  category: 'referral' | 'sales'
  version: string
  test?: boolean
  sentAt?: Date | string | null
  schedule: { line: string; basis: string; referral: string; sales: string }[]
  partner: { name: string; email: string; phone?: string; businessName?: string; cacNumber?: string; tin?: string; applyingAs?: string; address?: string }
  partnerSignedAt?: Date | string | null
  partnerSignedName?: string | null
  partnerIp?: string | null
  mdSignedAt?: Date | string | null
  mdSignedName?: string | null
  partnerNumber?: string | null
  assessmentPassedAt?: Date | string | null
  integrityPassedAt?: Date | string | null
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildAgreementHtml(a: AgreementView): string {
  const label = a.category === 'sales' ? 'Sales Partner' : 'Referral Partner'
  const party = a.partner.applyingAs === 'business' && a.partner.businessName
    ? `<strong>${esc(a.partner.businessName)}</strong>${a.partner.cacNumber ? ` (${esc(a.partner.cacNumber)})` : ''}, represented by ${esc(a.partner.name)}`
    : `<strong>${esc(a.partner.name)}</strong>, an individual`
  const rows = a.schedule.map((r) => `<tr><td>${esc(r.line)}</td><td>${esc(r.basis)}</td><td class="c">${esc(a.category === 'sales' ? r.sales : r.referral)}</td></tr>`).join('')

  const partnerBlock = a.partnerSignedAt
    ? `<div class="sigbox signed">\u2713 Digitally signed by <strong>${esc(a.partnerSignedName)}</strong> on ${fmtDateTime(a.partnerSignedAt)}${a.partnerIp ? ` &middot; IP ${esc(a.partnerIp)}` : ''}</div>`
    : `<div class="sigbox pending">Awaiting the Partner\u2019s signature</div>`
  const mdBlock = a.mdSignedAt
    ? `<div class="sigbox signed">\u2713 Countersigned for the Company by <strong>${esc(a.mdSignedName || MD_NAME)}</strong>, ${MD_TITLE}, on ${fmtDateTime(a.mdSignedAt)}${a.partnerNumber ? ` &middot; Partner No: <strong>${esc(a.partnerNumber)}</strong>` : ''}</div>`
    : `<div class="sigbox pending">To be countersigned by the Company after the Partner signs</div>`

  return `
<style>
  .psa * { box-sizing: border-box; }
  .psa { font-family: Arial, 'Liberation Sans', 'Segoe UI', sans-serif; font-size: 10.5pt; color: #2d3436; line-height: 1.55; }
  .psa .wordmark { font-size: 17pt; font-weight: 700; margin-bottom: 2px; }
  .psa .wordmark .go { color: #0e7c86; } .psa .wordmark .co { color: #6b7280; font-weight: 400; font-size: 10pt; }
  .psa .rule { border-bottom: 3px solid #0e7c86; margin: 4px 0 18px; }
  .psa h1 { text-align: center; color: #0e7c86; font-size: 15pt; margin: 6px 0 2px; letter-spacing: .02em; }
  .psa .sub { text-align: center; color: #6b7280; font-size: 9.5pt; margin-bottom: 18px; }
  .psa h2 { color: #0e7c86; font-size: 11pt; margin: 16px 0 5px; }
  .psa p { margin: 0 0 8px; }
  .psa ol.cl { margin: 0 0 8px; padding-left: 20px; } .psa ol.cl li { margin-bottom: 5px; }
  .psa table.sch { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 6px 0 8px; }
  .psa table.sch th, .psa table.sch td { border: 1px solid #cbd5d8; padding: 5px 8px; text-align: left; vertical-align: top; }
  .psa table.sch th { background: #f0f7f8; color: #4b5563; }
  .psa table.sch td.c { white-space: nowrap; font-weight: 700; }
  .psa .sigbox { border-radius: 6px; padding: 9px 12px; font-size: 9.5pt; margin: 6px 0 14px; }
  .psa .sigbox.signed { background: #eef8f0; border: 1px solid #b7e0c1; color: #1a5c2a; }
  .psa .sigbox.pending { background: #fff8ec; border: 1px solid #f0d9a8; color: #7a5b00; }
  .psa .test { border: 2px solid #c50f1f; color: #c50f1f; font-weight: 700; text-align: center; padding: 8px; margin-bottom: 14px; border-radius: 6px; }
  .psa .muted { color: #6b7280; font-size: 8.5pt; font-style: italic; }
</style>
<div class="psa">
  <div class="wordmark"><span class="go">go</span>live <span class="co">&nbsp;|&nbsp; ${COMPANY}</span></div>
  <div class="rule"></div>
  ${a.test ? '<div class="test">TEST AGREEMENT: NOT BINDING. Issued to test the signing process only.</div>' : ''}
  <h1>INDEPENDENT SALES PARTNER AGREEMENT</h1>
  <div class="sub">${esc(a.version)} &nbsp;|&nbsp; Application ${esc(a.ref)} &nbsp;|&nbsp; ${label}</div>

  <p>This Agreement is made on <strong>${fmtDate(a.sentAt || new Date())}</strong> between <strong>${COMPANY}</strong> (${COMPANY_RC}), of Lagos, Nigeria (the &ldquo;Company&rdquo;), and ${party}, email ${esc(a.partner.email)} (the &ldquo;Partner&rdquo;).</p>

  <h2>1. Background</h2>
  <p>The Company supplies technology solutions to businesses. The Partner has business relationships with organisations that may need them, has completed the Company&rsquo;s partner training${a.integrityPassedAt ? ` (anti-bribery and business integrity training completed ${fmtDate(a.integrityPassedAt)})` : ''} and passed its partner assessment${a.assessmentPassedAt ? ` on ${fmtDate(a.assessmentPassedAt)}` : ''}, and wishes to introduce such organisations to the Company in return for commission.</p>

  <h2>2. Appointment</h2>
  <ol class="cl">
    <li>The Company appoints the Partner as a non-exclusive, independent <strong>${label}</strong> of the GoLive Partner Network, and the Partner accepts.</li>
    <li>${a.category === 'sales'
      ? 'As a Sales Partner, the Partner may present the Company&rsquo;s solutions and manage the client relationship with the Company&rsquo;s support, within the limits of clause 3.'
      : 'As a Referral Partner, the Partner introduces prospects to the Company. The Company runs all meetings, prepares all quotations and closes the sale.'}</li>
    <li>Nothing in this Agreement restricts the Company from appointing other partners or selling directly to any organisation.</li>
  </ol>

  <h2>3. No authority, and how every sale is made</h2>
  <ol class="cl">
    <li>Every sale is made by the Company in its own name, on its own terms, and is quoted, contracted and invoiced by the Company. The Partner will not contract with, invoice, or accept payment from any client, and will not purchase licences or services for resale to any client.</li>
    <li>The Partner has no authority to, and will not, sign any document, agree or quote any final price or discount, promise any delivery date or service level, accept any client agreement on a client&rsquo;s behalf, or make any commitment on behalf of the Company or any vendor or distributor.</li>
    <li>The Partner will not represent that it is an employee or agent of the Company, or a partner, reseller or certified party of Microsoft or any other vendor, and will not use any vendor name or mark. The Partner may describe itself as a &ldquo;${esc(CERT_TITLE[a.category])}&rdquo; while its certificate is valid.</li>
  </ol>

  <h2>4. Deal registration</h2>
  <ol class="cl">
    <li>The Partner will register each prospect with the Company, through the Company&rsquo;s portal or as the Company otherwise directs in writing, before approaching it. Commission is payable only on registered prospects.</li>
    <li>The first valid registration holds a prospect for 90 days, extended by activity recorded in the portal. Existing Company customers, and prospects already in the pipeline of a Company employee, may not be registered. The Company&rsquo;s records are conclusive as to registration.</li>
  </ol>

  <h2>5. Commission</h2>
  <ol class="cl">
    <li>For each sale to a registered prospect, the Company will pay commission at the rates in the Schedule below.</li>
    <li>Commission is earned only on cash received by the Company, net of VAT and third-party pass-through costs. It becomes payable within 30 days of the client&rsquo;s payment clearing, less withholding tax deducted at the rate prescribed by law. The Partner must provide a Tax Identification Number before any payment is made.</li>
    <li>Commission already paid is recoverable by the Company, by deduction or repayment, if within 90 days of payment the client cancels, obtains a refund or defaults.</li>
    <li>No commission is payable on any sale obtained in breach of this Agreement. Overstating a client&rsquo;s requirements to increase the value of a sale, including the number of users, is a breach that makes the related commission recoverable in full.</li>
    <li>The Company may change the Schedule on 30 days&rsquo; written notice. Changes do not affect commission on sales already registered.</li>
  </ol>
  <p><strong>Schedule: commission rates for a ${label}</strong></p>
  <table class="sch"><thead><tr><th>Line of business</th><th>Basis</th><th>Rate</th></tr></thead><tbody>${rows}</tbody></table>

  <h2>6. Anti-bribery and business integrity</h2>
  <ol class="cl">
    <li>The Partner will comply with all applicable anti-bribery and anti-corruption laws, including the Corrupt Practices and Other Related Offences Act 2000, and with the standards in the Company&rsquo;s anti-bribery training, which the Partner confirms it has completed.</li>
    <li>The Partner will not offer, promise, give, request or accept any bribe, facilitation payment, or improper advantage, and will not pass any part of its commission to any person at a client or prospect.</li>
    <li>The Partner will report any request for, or suspicion of, an improper payment to the Company immediately.</li>
    <li>Breach of this clause entitles the Company to terminate this Agreement immediately, to withhold unpaid commission on the affected account, to revoke the Partner&rsquo;s certificate, and to report the matter to the authorities.</li>
  </ol>

  <h2>7. Confidentiality and data protection</h2>
  <ol class="cl">
    <li>Price lists, proposals and all other information the Company shares are confidential. The Partner will use them only for the named opportunity and will not disclose them to anyone else. This obligation survives termination.</li>
    <li>The Partner will handle client personal data in line with the Nigeria Data Protection Act 2023: collecting only what is needed, sharing it only through the Company&rsquo;s channels, not keeping it on personal devices or accounts, and notifying the Company immediately of any loss or unauthorised disclosure.</li>
  </ol>

  <h2>8. Restricted parties</h2>
  <p>The Partner will not pursue any opportunity with a person or organisation it knows or suspects to be subject to sanctions, or for use in a sanctioned country, and will raise any doubt with the Company before proceeding.</p>

  <h2>9. Certificate</h2>
  <p>On execution of this Agreement the Company will issue the Partner a certificate, valid for 12 months and verifiable online. The certificate remains the property of the Company and is revoked automatically on termination, or by the Company for breach.</p>

  <h2>10. Independent contractor</h2>
  <p>The Partner is an independent contractor, not an employee, agent or joint venturer of the Company. The Partner is responsible for its own taxes, costs and statutory obligations, and receives no salary, allowance or reimbursement unless the Company agrees otherwise in writing.</p>

  <h2>11. Term and termination</h2>
  <ol class="cl">
    <li>This Agreement starts on execution and continues until terminated.</li>
    <li>Either party may terminate it on 30 days&rsquo; written notice. The Company may terminate it immediately for breach of clause 3, 6, 7 or 8.</li>
    <li>On termination the Partner will stop presenting itself as a partner, return or delete the Company&rsquo;s confidential information, and remain entitled to commission earned under clause 5 on sales closed before termination, except where clause 6.4 applies.</li>
  </ol>

  <h2>12. General</h2>
  <ol class="cl">
    <li>This Agreement, with its Schedule, is the entire agreement between the parties about its subject matter. It may be varied only in writing by the Company, subject to clause 5.5.</li>
    <li>The Partner may not assign or subcontract its rights or obligations.</li>
    <li>This Agreement is governed by the laws of the Federal Republic of Nigeria, and the courts of Lagos State have jurisdiction over any dispute.</li>
    <li>The parties agree that electronic signatures on this Agreement are valid and binding.</li>
  </ol>

  <h2>Signatures</h2>
  <p><strong>Partner: ${esc(a.partner.name)}</strong>${a.partner.applyingAs === 'business' && a.partner.businessName ? `, for ${esc(a.partner.businessName)}` : ''}</p>
  ${partnerBlock}
  <p><strong>For ${COMPANY}</strong>: ${MD_NAME}, ${MD_TITLE}</p>
  ${mdBlock}
  <p class="muted">Electronic signature record maintained by the GoLive Cloud Portal. ${COMPANY} &middot; ${COMPANY_RC}.</p>
</div>`
}
