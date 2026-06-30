export interface PainPointOption {
  key: string
  label: string
  // Which ProductMapping add-on key this maps to, if any.
  addOnKey?: string
  // If selecting this pain point should bump the recommended package to at
  // least 'secure' (or 'ai' for the AI option), set the target package key.
  bumpsPackageTo?: 'secure' | 'ai'
  // If true, this pain point has no catalog answer — always flag for an
  // offline consult, regardless of what else is selected.
  alwaysConsult?: boolean
  consultLabel?: string // shown to the rep/customer as the reason for the consult flag
}

export const DISCOVERY_PAIN_POINTS: PainPointOption[] = [
  { key: 'email_security', label: 'Phishing / email security concerns', addOnKey: 'defenderOffice', bumpsPackageTo: 'secure' },
  { key: 'device_security', label: 'Lost/stolen device or endpoint threat concerns', addOnKey: 'defenderEndpoint', bumpsPackageTo: 'secure' },
  { key: 'shadow_it', label: 'Unsanctioned cloud apps / shadow IT visibility', addOnKey: 'defenderCloudApps', bumpsPackageTo: 'secure' },
  { key: 'manual_processes', label: 'Repetitive manual workflows or approvals', addOnKey: 'powerAutomate' },
  { key: 'custom_apps', label: 'Need a custom internal business app', addOnKey: 'powerApps' },
  { key: 'device_management', label: 'Need to manage/secure company devices remotely', bumpsPackageTo: 'secure' },
  { key: 'ai_productivity', label: 'Want AI help drafting, summarizing, or analyzing work', bumpsPackageTo: 'ai' },
  { key: 'collaboration', label: 'Team collaboration, meetings, or calling pain points', bumpsPackageTo: 'secure', alwaysConsult: true, consultLabel: 'Advanced Teams calling/meeting add-ons (not in current catalog) — confirm exact needs' },
  { key: 'backup_compliance', label: 'Backup, data retention, or compliance/eDiscovery needs', alwaysConsult: true, consultLabel: 'Backup & compliance scope (not in current catalog) — needs its own conversation' },
  { key: 'other', label: 'Something else (explain below)', alwaysConsult: true, consultLabel: 'Custom requirement — see notes' },
]

const PACKAGE_RANK: Record<string, number> = { starter: 0, secure: 1, ai: 2 }

export interface RecommendationInput {
  painPoints: string[]
  handlesSensitiveData: boolean
  validPackageKeys: string[] // package keys that currently exist in ProductMapping (active only)
  validAddOnKeys: string[]
}

export interface RecommendationResult {
  packageKey: string
  addOnKeys: string[]
  needsOfflineConsult: boolean
  consultReasons: string[]
}

/**
 * Turns a set of selected pain points into a real package + add-on
 * recommendation, using only keys that currently exist in the live
 * ProductMapping catalog. Anything that can't be matched to a real product
 * — collaboration add-ons, backup/compliance, or "other" — is surfaced as an
 * explicit offline-consult reason instead of being silently dropped.
 */
export function computeRecommendation(input: RecommendationInput): RecommendationResult {
  const { painPoints, handlesSensitiveData, validPackageKeys, validAddOnKeys } = input

  let packageRank = 0 // starts at 'starter'
  const addOnKeys = new Set<string>()
  const consultReasons = new Set<string>()

  if (handlesSensitiveData) {
    packageRank = Math.max(packageRank, PACKAGE_RANK['secure'])
  }

  for (const key of painPoints) {
    const opt = DISCOVERY_PAIN_POINTS.find(p => p.key === key)
    if (!opt) continue

    if (opt.bumpsPackageTo) {
      packageRank = Math.max(packageRank, PACKAGE_RANK[opt.bumpsPackageTo])
    }
    if (opt.addOnKey && validAddOnKeys.includes(opt.addOnKey)) {
      addOnKeys.add(opt.addOnKey)
    }
    if (opt.alwaysConsult && opt.consultLabel) {
      consultReasons.add(opt.consultLabel)
    }
  }

  // Resolve the rank back to a real, currently-active package key. If the
  // ideal tier doesn't exist (e.g. 'ai' was deactivated in Product Mapping),
  // step down to the next best one that does exist rather than recommending
  // something that can't actually be quoted.
  const rankToKey: Record<number, string> = { 2: 'ai', 1: 'secure', 0: 'starter' }
  let packageKey = rankToKey[packageRank]
  while (packageKey && !validPackageKeys.includes(packageKey) && packageRank > 0) {
    packageRank -= 1
    packageKey = rankToKey[packageRank]
  }
  if (!validPackageKeys.includes(packageKey)) {
    // Nothing matched at all (unlikely, but don't recommend a dead key)
    packageKey = validPackageKeys[0] || 'starter'
  }

  return {
    packageKey,
    addOnKeys: Array.from(addOnKeys),
    needsOfflineConsult: consultReasons.size > 0,
    consultReasons: Array.from(consultReasons),
  }
}
