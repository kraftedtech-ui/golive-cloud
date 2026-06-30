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
