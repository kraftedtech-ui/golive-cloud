/**
 * partnerConfig.ts: GoLive Partner Network constants.
 *
 * Client-safe: no database, no email. Imported by the public application form
 * and the admin panel as well as the server routes, so the wording a partner
 * agrees to and the wording stored on their record can never drift apart.
 */

export const PARTNER_EMAIL = 'partners@golivecompany.com'

export const SOLUTIONS = [
  'Microsoft 365 licensing, security and productivity',
  'Odoo implementation, licensing and support',
  'Custom software development and SaaS solutions',
  'Web hosting, domains and website services',
  'Managed IT services, backup and business continuity',
  'Digital Archive and electronic document management',
] as const

export const CATEGORY_INFO = {
  referral: {
    label: 'Referral Partner',
    short: 'Introduce and step back',
    detail: 'You introduce a prospect and GoLive runs the meeting, prepares the quotation and closes the sale.',
  },
  sales: {
    label: 'Sales Partner',
    short: 'Run the relationship with our support',
    detail: 'You present the solution and manage the client relationship with GoLive support, and stay with the account after the sale.',
  },
} as const

export const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  training: 'Training',
  assessment: 'Assessment',
  agreement: 'Agreement',
  active: 'Active partner',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

/** The forward path through accreditation. Declined and withdrawn can be set from any stage. */
export const STAGE_ORDER = ['applied', 'screening', 'interview', 'training', 'assessment', 'agreement', 'active'] as const

export const DECLARATIONS: { key: string; text: string }[] = [
  { key: 'otherAppointments', text: 'Do you currently hold a sales, agency or reseller appointment with any other organisation?' },
  { key: 'competingAppointments', text: 'Do any of those appointments cover products that compete with the solutions you selected?' },
  { key: 'politicallyExposed', text: 'Are you, or is any member of your immediate family, a government official, a candidate for political office, or a politically exposed person?' },
  { key: 'dishonestyRecord', text: 'Have you ever been convicted of, or investigated for, fraud, bribery, corruption or any dishonesty offence?' },
  { key: 'restricted', text: 'Are you subject to any restriction that would prevent you from approaching the organisations you have listed?' },
]

export const ACKNOWLEDGEMENTS: { key: string; text: string }[] = [
  { key: 'accurate', text: 'The information in this application is true, complete and accurate to the best of my knowledge.' },
  { key: 'noContract', text: 'Submitting this application creates no contract, appointment, authority or entitlement to commission.' },
  { key: 'noAuthority', text: 'If appointed, I may not sign any document, agree any price, offer any discount, or make any commitment on behalf of GoLive or any vendor.' },
  { key: 'accreditation', text: 'Appointment is subject to accreditation, including mandatory anti-bribery and business integrity training and an assessment.' },
  { key: 'dataConsent', text: 'I consent to GoLive processing the personal data in this application to assess and administer it, in line with the Nigeria Data Protection Act 2023 and the GoLive Privacy Policy.' },
]

export const MAX_NAMED_ACCOUNTS = 12
