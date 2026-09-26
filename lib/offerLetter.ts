/**
 * offerLetter.ts: the offer of employment, on the GoLive branded document
 * template (lib/brandedDocument), shared by the public signing page and the
 * PDF route. Wording unchanged from the original letter (sections 1 to 9);
 * layout follows the approved branded template, with digital-signature
 * blocks in place of wet-ink lines.
 */

import { MD_NAME, MD_TITLE, COMPANY, COMPANY_RC, fmtNaira, fmtDate, fmtDateTime } from './offerConfig'
import { type BrandedDoc, brandedWebHtml, clause, heading, esc } from './brandedDocument'

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
  mdIp?: string | null
  employeeNumber?: string | null
}

export function offerStatus(o: OfferView): string {
  return o.mdSignedAt ? 'Fully executed' : o.candidateSignedAt ? 'Accepted by the candidate, awaiting countersignature' : 'Awaiting acceptance'
}

export function buildOfferDoc(o: OfferView): BrandedDoc {
  const annual = o.salary * 12
  const first = (o.name || '').trim().split(/\s+/)[0] || 'Candidate'
  const co = COMPANY.replace(/\.$/, '')
  const rows: [string, string][] = [
    ['Application', o.ref],
    ['Job code', o.jobCode],
    ['Position', o.role],
    ['Candidate', o.name],
    ['Email', o.email],
    ['Reports to', MD_TITLE],
    ['Start date', fmtDate(o.startDate)],
    ['Salary', `${fmtNaira(o.salary)} per month gross (annualised ${fmtNaira(annual)})`],
    ['Offer date', fmtDate(o.sentAt || new Date())],
    ...(o.deadline ? [['Open until', fmtDate(o.deadline)] as [string, string]] : []),
    ...(o.employeeNumber ? [['Employee number', o.employeeNumber] as [string, string]] : []),
    ['Status', offerStatus(o)],
  ]
  return {
    title: 'Offer of Employment',
    preparedFor: o.name,
    coverTags: ['Employment', 'Role charter', 'Governance'],
    coverFooterLeft: `${o.jobCode}  \u2022  Private and confidential`,
    particulars: { title: 'Offer Particulars', note: o.mdSignedAt ? 'Details of this offer' : 'Review the terms below before accepting this offer', rows },
    intro: `<p>Date: <strong>${fmtDate(o.sentAt || new Date())}</strong> &nbsp;&middot;&nbsp; Private &amp; Confidential</p>
<p><strong>${esc(o.name)}</strong><br>${esc(o.email)}</p>
<p>Dear ${esc(first)},</p>
<p>Following your application (reference <strong>${esc(o.ref)}</strong>), assessment, and interview, we are pleased to offer you employment with <strong>${COMPANY}</strong> (${COMPANY_RC}, the &ldquo;Company&rdquo;) on the terms below.</p>`,
    firstHtml: [
      heading('1', 'Position and Commencement'),
      clause('1.1', `You will be employed as <strong>${esc(o.role)}</strong> (Job Code ${esc(o.jobCode)}), reporting to the ${MD_TITLE}, starting on <strong>${fmtDate(o.startDate)}</strong>.`),
      clause('1.2', 'Department: per your Role Charter \u2014 serving all Company arms (GoLive Naija, GoLive Forge, B2B Services).'),
      clause('1.3', 'Work location: Lagos &middot; hybrid per Company policy. Hours: Monday to Friday, 9:00\u201317:00 (WAT), with flexibility as operations reasonably require.'),
      heading('2', 'Remuneration'),
      `<p>Your salary will be <strong>${fmtNaira(o.salary)} per month gross</strong> (annualised ${fmtNaira(annual)}), paid monthly in arrears by bank transfer, less statutory deductions (PAYE and applicable contributions). Salary is reviewed at confirmation of employment and annually thereafter; a review is not a guarantee of an increase. Commission or bonus arrangements apply only where a separately signed addendum provides for them.</p>`,
      heading('3', 'Probation and Confirmation'),
      '<p>Your employment begins with a <strong>90-day probationary period</strong>, during which either party may terminate with 7 days\u2019 written notice. Confirmation as a direct employee is by written notice from the Company following a review at or before the end of probation, assessed against your Role Charter \u2014 including the governance and authority boundaries it sets. Confirmation is not automatic.</p>',
    ].join(''),
    sections: [
      {
        title: 'Duties, Confidentiality and Benefits',
        note: 'The standards and protections that apply to your role',
        html: [
          heading('4', 'Duties and Governance'),
          '<p>Your duties, authority limits, systems access, reporting cadence, and probation milestones are set out in your <strong>Role Charter &amp; Governance Pack</strong>, which you will countersign on or before your start date and which forms part of your terms of engagement. For clarity: this role carries no authority to sign contracts or bind the Company to any obligation, regardless of urgency, unless your Role Charter expressly provides otherwise.</p>',
          heading('5', 'Confidentiality and Data Protection'),
          '<p>You will sign a confidentiality and data-handling undertaking on or before your start date. Your obligations regarding Company and client information, and personal data under the Nigeria Data Protection Act 2023, are set out there and in the Employee Handbook, and survive the end of your employment.</p>',
          heading('6', 'Leave and Benefits'),
          '<p>You are entitled to leave and benefits as set out in the Employee Handbook, including annual leave after confirmation (pro-rated in year one), sick leave, and gazetted public holidays.</p>',
          heading('7', 'Notice After Confirmation'),
          '<p>Following confirmation, employment may be ended by either party giving one month\u2019s written notice, or by the Company paying salary in lieu.</p>',
        ].join(''),
      },
      {
        title: 'Governing Documents and Acceptance',
        note: 'How this offer is read and accepted',
        html: [
          heading('8', 'Governing Documents'),
          '<p>This offer should be read together with: (a) your Role Charter &amp; Governance Pack; (b) the Employee Handbook; and (c) the confidentiality and data-handling undertaking. Where this letter and the Handbook differ, this letter prevails; where the Role Charter is stricter, the Charter prevails for your role.</p>',
          heading('9', 'Acceptance and Electronic Signature'),
          `<p>This offer ${o.deadline ? `remains open until <strong>${fmtDate(o.deadline)}</strong>, after which it lapses` : 'remains open until the stated deadline'}. By signing electronically below, you accept the offer on these terms, and the parties agree that electronic signatures on this letter are valid and binding.</p>`,
          '<p>This letter supersedes all prior discussions regarding the terms of this role.</p>',
        ].join(''),
      },
    ],
    execution: {
      note: 'Electronic signatures on this offer are valid and binding',
      refLabel: 'Application reference',
      refValue: o.employeeNumber ? `${o.ref}  |  Employee No. ${o.employeeNumber}` : o.ref,
      parties: [
        {
          heading: 'Candidate',
          name: o.name,
          signed: o.candidateSignedAt ? { name: o.candidateSignedName || o.name, at: fmtDateTime(o.candidateSignedAt), ip: o.candidateIp } : null,
          pending: o.deadline ? `Awaiting acceptance: this offer lapses on ${fmtDate(o.deadline)}` : 'Awaiting acceptance',
        },
        {
          heading: `For ${co}`,
          name: `${o.mdSignedName || MD_NAME}  |  ${MD_TITLE}`,
          signed: o.mdSignedAt ? { name: o.mdSignedName || MD_NAME, at: fmtDateTime(o.mdSignedAt), ip: o.mdIp } : null,
          pending: 'To be countersigned by the Company upon acceptance',
        },
      ],
      closing: o.mdSignedAt ? undefined : 'To be countersigned by the Company upon acceptance',
      footnote: `Electronic signature record maintained by the GoLive Cloud Portal. ${COMPANY}  |  ${COMPANY_RC}.`,
    },
  }
}

/** The signing page: branded cover and body. */
export function buildOfferHtml(o: OfferView): string {
  return brandedWebHtml(buildOfferDoc(o))
}
