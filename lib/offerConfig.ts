/**
 * offerConfig.ts — per-role settings for digital offer letters.
 * Job codes continue the REF# series (Henry Arukwe = REF#01010).
 * Role names MUST match Application.role exactly.
 */

export interface OfferRoleConfig {
  jobCode: string
  hasCommission: boolean
}

export const OFFER_CONFIG: Record<string, OfferRoleConfig> = {
  'Operations Coordinator':           { jobCode: 'REF#01011', hasCommission: false },
  'Social Media & Community Manager': { jobCode: 'REF#01012', hasCommission: false },
  'Hosting Support Technician':       { jobCode: 'REF#01013', hasCommission: false },
  'Sales & Support Associate':        { jobCode: 'REF#01014', hasCommission: true },
}

export const MD_NAME = 'Adeniyi Olayemi'
export const MD_TITLE = 'Managing Director / CEO'
export const COMPANY = 'The GoLive Digital Solutions Company Ltd.'
export const COMPANY_RC = 'RC1644767'
export const PORTAL_URL = 'https://cloud.golivecompany.com'

export const fmtNaira = (n: number) => '\u20a6' + Number(n || 0).toLocaleString('en-NG')
export const fmtDate = (d?: Date | string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '\u2014'
export const fmtDateTime = (d?: Date | string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }) + ' WAT' : '\u2014'
