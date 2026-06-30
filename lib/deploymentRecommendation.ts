export interface DiscoveryLike {
  isExistingM365Customer: boolean
  currentEmailProvider?: string
  employeeCount: string
  handlesSensitiveData: boolean
  painPoints: string[]
  budgetRange?: string
}

export interface SetupFeeCatalogItem {
  key: string
  label: string
  category: string
  unit: 'flat' | 'per_user'
  amountUSD: number
  autoSuggestTags: string[]
  brdTrigger: boolean
  active?: boolean
}

const LARGE_ORG_BANDS = ['51–200', '200+']
const HIGH_BUDGET_RANGES = ['$2,000–10,000/mo', '$10,000+/mo']

/**
 * Turns a saved Discovery Assessment into a flat list of tags used to
 * auto-suggest deployment scope-of-work items and flag a BRD recommendation.
 * Kept separate from the discovery recommendation engine since this drives a
 * different downstream decision (deployment scope/fees, not which package).
 */
export function deriveDeploymentTags(d: DiscoveryLike): string[] {
  const tags: string[] = [d.isExistingM365Customer ? 'existing_m365' : 'net_new']
  const provider = (d.currentEmailProvider || '').toLowerCase()
  if (provider.includes('google') || provider.includes('workspace')) tags.push('source:google')
  if (provider.includes('exchange') || provider.includes('on-prem') || provider.includes('onprem')) tags.push('source:exchange_onprem')
  if (d.handlesSensitiveData) tags.push('sensitive_data')
  if (LARGE_ORG_BANDS.includes(d.employeeCount)) tags.push('large_org')
  if (d.budgetRange && HIGH_BUDGET_RANGES.includes(d.budgetRange)) tags.push('high_budget')
  tags.push(...d.painPoints)
  return tags
}

/** Catalog items whose autoSuggestTags intersect the derived tags — pre-ticked, not locked, in the checklist UI. */
export function suggestScopeKeys(tags: string[], catalog: SetupFeeCatalogItem[]): string[] {
  return catalog
    .filter(item => item.active !== false && item.autoSuggestTags.some(t => tags.includes(t)))
    .map(item => item.key)
}

export interface BrdRecommendation {
  recommended: boolean
  reasons: string[]
}

/**
 * A Business Requirement Document is recommended — never auto-added as a
 * line item — when the scope looks ERP-/custom-system-shaped and the budget
 * realistically supports a proper requirements phase. This is judgment
 * support for the rep, not an automatic charge.
 */
export function computeBrdRecommendation(params: {
  scopeKeys: string[]
  catalog: SetupFeeCatalogItem[]
  tags: string[]
}): BrdRecommendation {
  const { scopeKeys, catalog, tags } = params
  const reasons = new Set<string>()

  for (const key of scopeKeys) {
    const item = catalog.find(c => c.key === key)
    if (item?.brdTrigger) reasons.add(`Selected scope includes "${item.label}" — complex enough to warrant a scoped requirements phase first.`)
  }
  if (tags.includes('custom_apps') && tags.includes('high_budget')) {
    reasons.add('Customer wants a custom internal app and has the budget to properly scope it — a BRD protects both sides from rework.')
  }
  if (tags.includes('large_org') && (tags.includes('manual_processes') || tags.includes('custom_apps'))) {
    reasons.add('Larger organization with process-automation needs — worth formally documenting requirements before building.')
  }

  return { recommended: reasons.size > 0, reasons: Array.from(reasons) }
}

export interface SetupFeeLineItem {
  key: string
  label: string
  unit: 'flat' | 'per_user'
  amountUSD: number
  quantity: number
  lineTotalUSD: number
}

export function computeSetupFeeLineItems(scopeKeys: string[], userCount: number, catalog: SetupFeeCatalogItem[]): { lines: SetupFeeLineItem[]; totalUSD: number } {
  const lines: SetupFeeLineItem[] = scopeKeys.map(key => {
    const item = catalog.find(c => c.key === key)
    if (!item) return null
    const quantity = item.unit === 'per_user' ? Math.max(1, userCount || 1) : 1
    return { key: item.key, label: item.label, unit: item.unit, amountUSD: item.amountUSD, quantity, lineTotalUSD: item.amountUSD * quantity }
  }).filter((l): l is SetupFeeLineItem => l !== null)

  const totalUSD = lines.reduce((sum, l) => sum + l.lineTotalUSD, 0)
  return { lines, totalUSD }
}

// ── Dynamic onboarding/execution task list ──────────────────────────────────
// Replaces a static 22-item checklist shown to every customer regardless of
// relevance. Tasks only appear when they're actually relevant to this
// customer's migration type, selected scope of work, and data to migrate —
// so a net-new customer never sees "back up existing emails," and a customer
// with no Power Automate in scope never sees a Power Automate build task.

export interface TaskContext {
  migrationType: 'existing_m365' | 'other_platform' | 'net_new'
  scopeOfWork: string[]
  dataScope: string[]
}

export interface DeploymentTask {
  key: string
  label: string
  phase: 'Setup' | 'Migration' | 'Security' | 'Automation' | 'Training'
  condition?: (ctx: TaskContext) => boolean
}

const hasScope = (ctx: TaskContext, key: string) => ctx.scopeOfWork.includes(key)
const hasData = (ctx: TaskContext, ...labels: string[]) => labels.some(l => ctx.dataScope.includes(l))
const isMigrating = (ctx: TaskContext) => ctx.migrationType !== 'net_new'

export const DEPLOYMENT_TASK_TEMPLATE: DeploymentTask[] = [
  // Setup — universal, every customer needs these regardless of scope
  { key: 'create_tenant', label: 'Create Microsoft 365 tenant', phase: 'Setup' },
  { key: 'verify_domain', label: 'Verify custom domain', phase: 'Setup' },
  { key: 'create_users', label: 'Create all user accounts', phase: 'Setup' },
  { key: 'configure_teams_sp', label: 'Configure Teams and SharePoint', phase: 'Setup' },
  { key: 'shared_mailboxes', label: 'Set up shared mailboxes', phase: 'Setup' },

  // Migration — only relevant if there's actually something to migrate
  { key: 'backup_emails', label: 'Back up existing emails', phase: 'Migration', condition: isMigrating },
  { key: 'import_emails', label: 'Import emails to Microsoft 365', phase: 'Migration', condition: isMigrating },
  { key: 'update_mx', label: 'Update MX records', phase: 'Migration', condition: isMigrating },
  { key: 'migrate_calendar', label: 'Migrate calendar & contacts', phase: 'Migration', condition: ctx => isMigrating(ctx) && hasData(ctx, 'Calendar', 'Calendar & contacts') },
  { key: 'migrate_files', label: 'Migrate files to OneDrive/SharePoint', phase: 'Migration', condition: ctx => hasData(ctx, 'Files / shared drives') },
  { key: 'migrate_teams_history', label: 'Migrate Teams/Slack history', phase: 'Migration', condition: ctx => hasData(ctx, 'Teams/Slack history', 'Teams or Slack history') },
  { key: 'spf', label: 'Configure SPF record', phase: 'Migration' },
  { key: 'dkim', label: 'Configure DKIM signing', phase: 'Migration' },
  { key: 'dmarc', label: 'Configure DMARC policy', phase: 'Migration' },

  // Security — only the pieces actually in scope
  { key: 'mfa', label: 'Enable MFA for all users', phase: 'Security' },
  { key: 'conditional_access', label: 'Configure Conditional Access', phase: 'Security', condition: ctx => hasScope(ctx, 'conditional_access_baseline') },
  { key: 'defender_office', label: 'Set up Defender for Office 365', phase: 'Security', condition: ctx => hasScope(ctx, 'defender_office_rollout') },
  { key: 'defender_endpoint', label: 'Set up Defender for Endpoint', phase: 'Security', condition: ctx => hasScope(ctx, 'defender_endpoint_rollout') },
  { key: 'defender_cloudapps', label: 'Set up Defender for Cloud Apps', phase: 'Security', condition: ctx => hasScope(ctx, 'defender_cloudapps_rollout') },
  { key: 'intune', label: 'Enroll devices in Intune', phase: 'Security', condition: ctx => hasScope(ctx, 'intune_device_setup') },
  { key: 'secure_score', label: 'Review Microsoft Secure Score', phase: 'Security' },

  // Automation — only if it was actually quoted/scoped
  { key: 'power_automate', label: 'Build & test Power Automate workflow', phase: 'Automation', condition: ctx => hasScope(ctx, 'power_automate_build') },
  { key: 'power_apps', label: 'Build & test custom Power App', phase: 'Automation', condition: ctx => hasScope(ctx, 'power_apps_build') },
  { key: 'copilot', label: 'Enable & configure Copilot', phase: 'Automation', condition: ctx => hasScope(ctx, 'copilot_enablement') },
  { key: 'teams_calling', label: 'Configure Teams calling/meeting rooms', phase: 'Automation', condition: ctx => hasScope(ctx, 'teams_calling_setup') },
  { key: 'backup_compliance', label: 'Configure backup & compliance retention', phase: 'Automation', condition: ctx => hasScope(ctx, 'backup_compliance_setup') },

  // Training — universal
  { key: 'training_outlook', label: 'Run staff Outlook training', phase: 'Training' },
  { key: 'training_teams', label: 'Run Teams training session', phase: 'Training' },
  { key: 'training_onedrive', label: 'Run OneDrive training', phase: 'Training' },
  { key: 'training_admin', label: 'Admin training session', phase: 'Training' },
  { key: 'handover', label: 'Hand over credentials and docs', phase: 'Training' },
  { key: 'checkin_30day', label: 'Schedule 30-day check-in', phase: 'Training' },
]

export function generateDeploymentTasks(ctx: TaskContext): DeploymentTask[] {
  return DEPLOYMENT_TASK_TEMPLATE.filter(t => !t.condition || t.condition(ctx))
}
