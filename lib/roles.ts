/**
 * roles.ts: portal roles and what each may do. CLIENT-SAFE (no server imports),
 * so menus and buttons use the same rules the server enforces.
 *
 *   admin       everything, including every signature and approval
 *   operations  everything sales can, plus the Partner Network screens:
 *               notes, early stage moves, milestones, commission previews.
 *               Never signs, approves, publishes, pays or deletes.
 *   sales       leads, pipeline, proposals, customers, deployments
 *   support     deployments, transfer requests, customer accounts (read),
 *               knowledge base. No pricing, proposals, leads or commission.
 *   viewer      read-only
 *
 * Enforcement lives in middleware.ts (API areas a role may not reach at all)
 * and in each partner route (actions within a screen). Hiding a button is
 * convenience only; the server refuses regardless.
 */

export const PORTAL_ROLES = ['admin', 'operations', 'sales', 'support', 'viewer'] as const
export type PortalRole = (typeof PORTAL_ROLES)[number]

export const ROLE_LABEL: Record<PortalRole, string> = {
  admin: 'Admin',
  operations: 'Operations',
  sales: 'Sales',
  support: 'Support',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTION: Record<PortalRole, string> = {
  admin: 'Admin: full access, every signature and approval, team management',
  operations: 'Operations: sales access plus partner management, without signing or approving',
  sales: 'Sales: leads, pipeline, proposals, customers',
  support: 'Support: deployments, transfer requests, customer accounts (read), knowledge base',
  viewer: 'Viewer: read-only',
}

export const isRole = (r: unknown): r is PortalRole => typeof r === 'string' && (PORTAL_ROLES as readonly string[]).includes(r)

/** Partner Network screens: applications, deal registrations, commission schedule (read). */
export const canManagePartners = (role?: string | null) => role === 'admin' || role === 'operations'
export const isAdminRole = (role?: string | null) => role === 'admin'

/** Partner application actions the operations role may take. Everything else is admin-only. */
export const OPS_PARTNER_ACTIONS = ['notes', 'stage', 'recheck', 'sendTraining', 'resendDocuments'] as const
/** Stages operations may move an applicant to. Agreement, active, declined and withdrawn are admin decisions. */
export const OPS_STAGES = ['applied', 'screening', 'interview', 'training'] as const
/** Deal registration actions the operations role may take. */
export const OPS_DEAL_ACTIONS = ['milestone'] as const

/**
 * API areas the support role may not reach at all (prefix match).
 * Customer accounts are read-only for support: see SUPPORT_READ_ONLY.
 */
export const SUPPORT_DENIED_API = [
  '/api/leads', '/api/proposals', '/api/sales-documents', '/api/pricing-catalog', '/api/setup-fee-catalog',
  '/api/product-mappings', '/api/commission-rules', '/api/commission-period', '/api/exchange-rates',
  '/api/discovery-assessments', '/api/partners', '/api/partner-deals', '/api/partner-commission',
  '/api/partner-commissions', '/api/users', '/api/positions', '/api/employees', '/api/applications',
] as const
export const SUPPORT_READ_ONLY = ['/api/customers'] as const

/** Menu keys hidden from the support role (the sidebar reads this). */
export const SUPPORT_HIDDEN_MENU = ['assessments', 'pipeline', 'commissions', 'discovery', 'proposals', 'product-mapping', 'payment-risk'] as const
