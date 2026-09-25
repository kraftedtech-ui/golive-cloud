/**
 * partnerAgreement.ts: the GoLive Independent Sales Partner Agreement.
 *
 * One document for both categories; clause 2 states which one the partner is
 * appointed to. Rendered as HTML for the signing page and the PDF, like the
 * offer letter (lib/offerLetter.ts), with the same digital signature blocks.
 *
 * Rates are not in this file. They live in the versioned commission schedule
 * (portal: Partner Network > Commission schedule), and each agreement records
 * the version it was sent with. STARTER_SCHEDULE below only seeds the first
 * draft of that schedule.
 *
 * Until a schedule is published, an agreement can only be sent to an email
 * address in PARTNER_AGREEMENT_TEST_EMAILS (comma-separated). Those are marked
 * TEST, are not binding, and mint test numbers (GL-PTR-T..., GL-CERT-TEST-...).
 *
 * Have Elthon Partners review the clauses before the first real agreement.
 */

import { MD_NAME, MD_TITLE, COMPANY, COMPANY_RC, fmtDate, fmtDateTime } from './offerConfig'
import { type BrandedDoc, brandedWebHtml, clause, heading, esc, rateCell } from './brandedDocument'

export const AGREEMENT_VERSION = 'PSA-2026-v2'

/** Seeds the first draft of the commission schedule. Rates are strings, so bands can be written out in full. */
export const STARTER_SCHEDULE: { line: string; basis: string; referral: string; sales: string }[] = [
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
export function agreementMode(email: string, schedulePublished: boolean): { allowed: boolean; test: boolean; reason?: string } {
  if (testEmails().includes(String(email || '').toLowerCase())) return { allowed: true, test: true }
  if (schedulePublished) return { allowed: true, test: false }
  return { allowed: false, test: false, reason: 'No commission schedule has been published yet. Publish one under Partner Network > Commission schedule, or add this applicant\u2019s email to PARTNER_AGREEMENT_TEST_EMAILS to send a test agreement.' }
}

export const CERT_TITLE = { referral: 'GoLive Accredited Referral Partner', sales: 'GoLive Accredited Sales Partner' } as const

export interface AgreementView {
  ref: string
  category: 'referral' | 'sales'
  version: string
  test?: boolean
  sentAt?: Date | string | null
  schedule: { line: string; basis: string; referral: string; sales: string }[]
  scheduleVersion?: number | null
  scheduleEffectiveAt?: Date | string | null
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

const d8 = (d?: Date | string | null) => (d ? fmtDate(d) : '')

export function agreementStatus(a: AgreementView): string {
  return a.mdSignedAt ? 'Fully executed' : a.partnerSignedAt ? 'Signed by the Partner, awaiting countersignature' : 'Draft for execution'
}

/** The agreement as a branded document (lib/brandedDocument): one description for the signing page and the PDF. */
export function buildAgreementDoc(a: AgreementView): BrandedDoc {
  const label = a.category === 'sales' ? 'Sales Partner' : 'Referral Partner'
  const party = a.partner.applyingAs === 'business' && a.partner.businessName
    ? `${esc(a.partner.businessName)}${a.partner.cacNumber ? ` (${esc(a.partner.cacNumber)})` : ''}, represented by ${esc(a.partner.name)}`
    : `${esc(a.partner.name)}, an individual`
  const status = agreementStatus(a)
  const co = COMPANY.replace(/\.$/, '')
  const rows = a.schedule.map((r) => `<tr><td>${esc(r.line)}</td><td>${esc(r.basis)}</td>${rateCell(a.category === 'sales' ? r.sales : r.referral)}</tr>`).join('')

  const particulars: [string, string][] = [
    ['Application', a.ref],
    ['Agreement', a.version],
    ['Partner type', label],
    ['Partner', a.partner.applyingAs === 'business' && a.partner.businessName ? `${a.partner.businessName} (${a.partner.name})` : a.partner.name],
    ['Email', a.partner.email],
    ['Agreement date', d8(a.sentAt || new Date())],
    ['Commission schedule', a.scheduleVersion ? `Version ${a.scheduleVersion}${a.scheduleEffectiveAt ? `, effective ${d8(a.scheduleEffectiveAt)}` : ''}` : 'Starter lines (no version published)'],
    ['Company', COMPANY],
    ['Registration', COMPANY_RC],
    ...(a.partnerNumber ? [['Partner number', a.partnerNumber] as [string, string]] : []),
    ['Status', status],
  ]

  return {
    title: 'Independent Sales Partner Agreement',
    preparedFor: a.partner.applyingAs === 'business' && a.partner.businessName ? a.partner.businessName : a.partner.name,
    coverTags: ['Partner network', 'Sales governance', 'Commission'],
    coverFooterLeft: `${a.version}  \u2022  ${a.mdSignedAt ? 'Executed' : 'Draft for execution'}`,
    warning: a.test ? 'TEST AGREEMENT: NOT BINDING. Issued to test the signing process only.' : undefined,
    particulars: { title: 'Agreement Particulars', note: 'Review the details below before signing this agreement', rows: particulars },
    intro: `<p>This Agreement is made on ${d8(a.sentAt || new Date())} between ${esc(COMPANY)} (${COMPANY_RC}), of Lagos, Nigeria (the &ldquo;Company&rdquo;), and ${party}, email ${esc(a.partner.email)} (the &ldquo;Partner&rdquo;).</p>`,
    firstHtml: [
      heading('1', 'Background'),
      `<p>The Company supplies technology solutions to businesses. The Partner has business relationships with organisations that may need them, has completed the Company&rsquo;s partner training${a.integrityPassedAt ? ` (anti-bribery and business integrity training completed ${d8(a.integrityPassedAt)})` : ''} and passed its partner assessment${a.assessmentPassedAt ? ` on ${d8(a.assessmentPassedAt)}` : ''}, and wishes to introduce such organisations to the Company in return for commission.</p>`,
      heading('2', 'Appointment'),
      clause('2.1', `The Company appoints the Partner as a non-exclusive, independent ${label} of the GoLive Partner Network, and the Partner accepts.`),
      clause('2.2', a.category === 'sales'
        ? 'As a Sales Partner, the Partner may present the Company&rsquo;s solutions and manage the client relationship with the Company&rsquo;s support, within the limits of clause 3.'
        : 'As a Referral Partner, the Partner introduces prospects to the Company. The Company runs all meetings, prepares all quotations and closes the sale.'),
      clause('2.3', 'Nothing in this Agreement restricts the Company from appointing other partners or selling directly to any organisation.'),
    ].join(''),
    sections: [
      {
        title: 'Sales Authority and Deal Registration',
        note: 'The Company contracts and invoices every client sale',
        html: [
          heading('3', 'No authority, and how every sale is made'),
          clause('3.1', 'Every sale is made by the Company in its own name, on its own terms, and is quoted, contracted and invoiced by the Company. The Partner will not contract with, invoice, or accept payment from any client, and will not purchase licences or services for resale to any client.'),
          clause('3.2', 'The Partner has no authority to, and will not, sign any document, agree or quote any final price or discount, promise any delivery date or service level, accept any client agreement on a client&rsquo;s behalf, or make any commitment on behalf of the Company or any vendor or distributor.'),
          clause('3.3', `The Partner will not represent that it is an employee or agent of the Company, or a partner, reseller or certified party of Microsoft or any other vendor, and will not use any vendor name or mark. The Partner may describe itself as a &ldquo;${esc(CERT_TITLE[a.category])}&rdquo; while its certificate is valid.`),
          heading('4', 'Deal registration'),
          clause('4.1', 'The Partner will register each prospect with the Company, through the Company&rsquo;s portal or as the Company otherwise directs in writing, before approaching it. Commission is payable only on registered prospects.'),
          clause('4.2', 'A registration is valid for 90 days from its approval by the Company. It is extended to 60 days after each of the following, when recorded by the Company: a meeting with the prospect attended by the Company; a quotation or proposal issued by the Company; or the prospect&rsquo;s written confirmation of interest to the Company. No registration remains valid more than 180 days after its approval unless the Company extends it in writing. Activity recorded by the Partner alone does not extend a registration.'),
          clause('4.3', 'Existing Company customers, and prospects already in the pipeline of a Company employee, may not be registered. The first valid registration of a prospect takes precedence. The Company&rsquo;s records are conclusive as to registration.'),
        ].join(''),
      },
      {
        title: 'Commission',
        note: 'Commission is earned only on cash received by the Company',
        html: [
          heading('5', 'Commission'),
          clause('5.1', 'For each sale to a registered prospect, the Company will pay commission at the rates in the Company&rsquo;s published commission schedule, as set out in clause 5.5. The schedule in force when this Agreement was issued is reproduced below.'),
          clause('5.2', 'Commission is earned only on cash received by the Company, net of VAT and third-party pass-through costs. It becomes payable within 30 days of the client&rsquo;s payment clearing, less withholding tax deducted at the rate prescribed by law. The Partner must provide a Tax Identification Number before any payment is made.'),
          clause('5.3', 'Commission already paid is recoverable by the Company, by deduction or repayment, if within 90 days of payment the client cancels, obtains a refund or defaults.'),
          clause('5.4', 'No commission is payable on any sale obtained in breach of this Agreement. Overstating a client&rsquo;s requirements to increase the value of a sale, including the number of users, is a breach that makes the related commission recoverable in full.'),
          clause('5.5', 'The Company may change the Schedule at any time, with effect from its publication in the Company&rsquo;s portal, and will notify the Partner of each change by email and in the portal. Commission on a sale&rsquo;s first year is paid at the rates in force on the date its prospect was registered, provided the registration was valid when the sale closed. Renewal commission is paid at the rates in force on the date of each renewal. A lapsed registration carries no rate, and any later registration of the same prospect carries the rates in force at that later date.'),
          `<h3>Schedule: commission rates for a ${label}${a.scheduleVersion ? `, version ${a.scheduleVersion}${a.scheduleEffectiveAt ? `, effective ${d8(a.scheduleEffectiveAt)}` : ''}` : ''}</h3>`,
          `<table class="sched"><thead><tr><th>Line of business</th><th>Basis</th><th>Rate</th></tr></thead><tbody>${rows}</tbody></table>`,
        ].join(''),
      },
      {
        title: 'Integrity, Confidentiality and Data Protection',
        note: 'Mandatory standards for every registered opportunity',
        html: [
          heading('6', 'Anti-bribery and business integrity'),
          clause('6.1', 'The Partner will comply with all applicable anti-bribery and anti-corruption laws, including the Corrupt Practices and Other Related Offences Act 2000, and with the standards in the Company&rsquo;s anti-bribery training, which the Partner confirms it has completed.'),
          clause('6.2', 'The Partner will not offer, promise, give, request or accept any bribe, facilitation payment, or improper advantage, and will not pass any part of its commission to any person at a client or prospect.'),
          clause('6.3', 'The Partner will report any request for, or suspicion of, an improper payment to the Company immediately.'),
          clause('6.4', 'Breach of this clause entitles the Company to terminate this Agreement immediately, to withhold unpaid commission on the affected account, to revoke the Partner&rsquo;s certificate, and to report the matter to the authorities.'),
          heading('7', 'Confidentiality and data protection'),
          clause('7.1', 'Price lists, proposals and all other information the Company shares are confidential. The Partner will use them only for the named opportunity and will not disclose them to anyone else. This obligation survives termination.'),
          clause('7.2', 'The Partner will handle client personal data in line with the Nigeria Data Protection Act 2023: collecting only what is needed, sharing it only through the Company&rsquo;s channels, not keeping it on personal devices or accounts, and notifying the Company immediately of any loss or unauthorised disclosure.'),
          heading('8', 'Restricted parties'),
          '<p>The Partner will not pursue any opportunity with a person or organisation it knows or suspects to be subject to sanctions, or for use in a sanctioned country, and will raise any doubt with the Company before proceeding.</p>',
        ].join(''),
      },
      {
        title: 'Partner Status, Term and General Terms',
        note: 'Certificate status and the terms governing this agreement',
        html: [
          heading('9', 'Certificate'),
          '<p>On execution of this Agreement the Company will issue the Partner a certificate, valid for 12 months and verifiable online. The certificate remains the property of the Company and is revoked automatically on termination, or by the Company for breach.</p>',
          heading('10', 'Independent contractor'),
          '<p>The Partner is an independent contractor, not an employee, agent or joint venturer of the Company. The Partner is responsible for its own taxes, costs and statutory obligations, and receives no salary, allowance or reimbursement unless the Company agrees otherwise in writing.</p>',
          heading('11', 'Term and termination'),
          clause('11.1', 'This Agreement starts on execution and continues until terminated.'),
          clause('11.2', 'Either party may terminate it on 30 days&rsquo; written notice. The Company may terminate it immediately for breach of clause 3, 6, 7 or 8.'),
          clause('11.3', 'On termination the Partner will stop presenting itself as a partner, return or delete the Company&rsquo;s confidential information, and remain entitled to commission earned under clause 5 on sales closed before termination, except where clause 6.4 applies.'),
          heading('12', 'General'),
          clause('12.1', 'This Agreement, with its Schedule, is the entire agreement between the parties about its subject matter. It may be varied only in writing by the Company, subject to clause 5.5.'),
          clause('12.2', 'The Partner may not assign or subcontract its rights or obligations.'),
          clause('12.3', 'This Agreement is governed by the laws of the Federal Republic of Nigeria, and the courts of Lagos State have jurisdiction over any dispute.'),
          clause('12.4', 'The parties agree that electronic signatures on this Agreement are valid and binding.'),
        ].join(''),
      },
    ],
    execution: {
      note: 'Electronic signatures on this agreement are valid and binding',
      refLabel: 'Application reference',
      refValue: a.partnerNumber ? `${a.ref}  |  Partner No. ${a.partnerNumber}` : a.ref,
      parties: [
        {
          heading: 'Partner',
          name: a.partner.applyingAs === 'business' && a.partner.businessName ? `${a.partner.name}  |  for ${a.partner.businessName}` : a.partner.name,
          signed: a.partnerSignedAt ? { name: a.partnerSignedName || a.partner.name, at: fmtDateTime(a.partnerSignedAt), ip: a.partnerIp } : null,
          pending: 'Awaiting the Partner\u2019s signature',
        },
        {
          heading: `For ${co}`,
          name: `${a.mdSignedName || MD_NAME}  |  ${MD_TITLE}`,
          signed: a.mdSignedAt ? { name: a.mdSignedName || MD_NAME, at: fmtDateTime(a.mdSignedAt), extra: a.partnerNumber ? `Partner No. ${a.partnerNumber}` : undefined } : null,
          pending: a.partnerSignedAt ? 'Awaiting countersignature' : 'To be countersigned after the Partner signs',
        },
      ],
      closing: a.mdSignedAt ? undefined : 'To be countersigned by the Company after the Partner signs',
      footnote: `Electronic signature record maintained by the GoLive Cloud Portal. ${COMPANY}  |  ${COMPANY_RC}.`,
    },
  }
}

/** The signing page: branded cover and body. */
export function buildAgreementHtml(a: AgreementView): string {
  return brandedWebHtml(buildAgreementDoc(a))
}
