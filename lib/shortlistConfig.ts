/**
 * shortlistConfig.ts — per-role settings for the automated shortlist
 * interview invitation.
 *
 * Salary figures are monthly gross NGN, displayed to the candidate in the
 * invitation email. Booking links are "Bookings with me" meeting-type URLs
 * (outlook.office.com/bookwithme) — one meeting type per role so the
 * calendar entry identifies which interview guide to use.
 *
 * Role names MUST match Application.role exactly (they come from the
 * assessment pages' ROLE.name).
 */

export interface ShortlistRoleConfig {
  lower: number
  upper: number
  booking: string
  commission: boolean
}

export const SHORTLIST: Record<string, ShortlistRoleConfig> = {
  'Operations Coordinator': {
    lower: 200000,
    upper: 280000,
    booking: 'https://outlook.office.com/bookwithme/user/dc6d6e564429486b916c71ab3cdd60ab@golivecompany.com/meetingtype/iRKnn0Xje0ObF4PssxfuIA2?anonymous&ismsaljsauthenabled&ep=mcard',
    commission: false,
  },
  'Social Media & Community Manager': {
    lower: 150000,
    upper: 250000,
    booking: 'https://outlook.office.com/bookwithme/user/dc6d6e564429486b916c71ab3cdd60ab@golivecompany.com/meetingtype/AaKhUGXwY0eV4mqERDQvPQ2?anonymous&ismsaljsauthenabled&ep=mcard',
    commission: false,
  },
  'Hosting Support Technician': {
    lower: 180000,
    upper: 280000,
    booking: 'https://outlook.office.com/bookwithme/user/dc6d6e564429486b916c71ab3cdd60ab@golivecompany.com/meetingtype/T1FPj93yu0ma_0GMHbEwpw2?anonymous&ismsaljsauthenabled&ep=mcard',
    commission: false,
  },
  'Sales & Support Associate': {
    lower: 120000,
    upper: 180000,
    booking: 'https://outlook.office.com/bookwithme/user/dc6d6e564429486b916c71ab3cdd60ab@golivecompany.com/meetingtype/QuY4qa0-60ukfxxDhNX_Ag2?anonymous&ismsaljsauthenabled&ep=mcard',
    commission: true,
  },
}

export const fmtNaira = (n: number) => '\u20a6' + n.toLocaleString('en-NG')
