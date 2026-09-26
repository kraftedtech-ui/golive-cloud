/**
 * hireProvisioning.ts — maps a hiring role to the portal access it receives
 * and whether it is commission-eligible at all.
 *
 * Least privilege by default: a new hire gets "viewer" unless the role's
 * duties genuinely require write access to commercial records. Only roles
 * whose signed terms include commission are marked eligible — the Operations
 * Coordinator offer letter states explicitly that the role carries none, and
 * this map is what keeps the portal agreeing with the contract.
 */

export type PortalRole = 'admin' | 'operations' | 'sales' | 'support' | 'viewer'

export interface RoleAccess {
  portalRole: PortalRole
  commissionEligible: boolean
  note: string
}

export const ROLE_ACCESS: Record<string, RoleAccess> = {
  'Operations Coordinator': {
    portalRole: 'operations',
    commissionEligible: false,
    note: 'Operations: customer onboarding, payment follow-up and partner management, without signing or approving (SOP 2).',
  },
  'Social Media & Community Manager': {
    portalRole: 'sales',
    commissionEligible: false,
    note: 'Logs social media enquiries as leads (SOP 4); no commission.',
  },
  'Hosting Support Technician': {
    portalRole: 'support',
    commissionEligible: false,
    note: 'Support: deployments, transfer requests, customer accounts (read), knowledge base (SOP 5). WHMCS is separate.',
  },
  'Full Stack Engineer': {
    portalRole: 'viewer',
    commissionEligible: false,
    note: 'Engineering access is granted in the repository and server, not by portal role.',
  },
  'Sales & Support Associate': {
    portalRole: 'sales',
    commissionEligible: true,
    note: 'Commission-bearing per signed addendum; needs leads, pipeline and proposals.',
  },
}

export const DEFAULT_ACCESS: RoleAccess = {
  portalRole: 'viewer',
  commissionEligible: false,
  note: 'No mapping for this role — defaulting to least privilege.',
}

export function accessForRole(role: string): RoleAccess {
  return ROLE_ACCESS[role] || DEFAULT_ACCESS
}

export type ScreeningStatus = 'pending' | 'in_progress' | 'cleared' | 'failed'

export const SCREENING_LABELS: Record<ScreeningStatus, string> = {
  pending: 'BCI: not started',
  in_progress: 'BCI: in progress',
  cleared: 'BCI: cleared',
  failed: 'BCI: failed',
}

export const SCREENING_PROVIDER = 'Background Check International'
