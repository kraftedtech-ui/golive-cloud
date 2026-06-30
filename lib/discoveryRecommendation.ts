export interface PainPointOption {
  key: string
  label: string
  // Plain-English version shown on the public, customer-facing form — no
  // salesperson there to translate jargon, so this needs to stand alone.
  customerLabel?: string
  customerDescription?: string
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
  {
    key: 'email_security', label: 'Phishing / email security concerns', addOnKey: 'defenderOffice', bumpsPackageTo: 'secure',
    customerLabel: 'We worry about phishing emails or scams reaching our team',
    customerDescription: 'We add a filter that catches fake "your account is locked" emails, malicious attachments, and look-alike sender tricks before they land in an inbox.',
  },
  {
    key: 'device_security', label: 'Lost/stolen device or endpoint threat concerns', addOnKey: 'defenderEndpoint', bumpsPackageTo: 'secure',
    customerLabel: 'A lost or stolen laptop/phone would worry us',
    customerDescription: 'We can detect threats on company laptops and phones, and you gain the ability to remotely lock or wipe a device if it goes missing.',
  },
  {
    key: 'shadow_it', label: 'Unsanctioned cloud apps / shadow IT visibility', addOnKey: 'defenderCloudApps', bumpsPackageTo: 'secure',
    customerLabel: "We don't have visibility into what apps our team is signing into with their work email",
    customerDescription: 'We give you a clear picture of which outside apps and services your team has connected to their work account, so nothing risky slips in unnoticed.',
  },
  {
    key: 'manual_processes', label: 'Repetitive manual workflows or approvals', addOnKey: 'powerAutomate',
    customerLabel: 'We waste time on repetitive manual tasks (approvals, data entry, notifications)',
    customerDescription: "We can automate routine steps — like routing a form to the right approver automatically — so your team isn't doing it by hand every time.",
  },
  {
    key: 'custom_apps', label: 'Need a custom internal business app', addOnKey: 'powerApps',
    customerLabel: 'We need a simple internal tool/app built for how we work, but have no developers',
    customerDescription: "We can build lightweight internal apps — like an inventory tracker or a request form — without needing a full software development project.",
  },
  {
    key: 'device_management', label: 'Need to manage/secure company devices remotely', bumpsPackageTo: 'secure',
    customerLabel: 'We want to manage and secure company devices remotely',
    customerDescription: 'We can enforce security settings (passcodes, encryption) on company devices and push updates remotely, without needing someone physically present.',
  },
  {
    key: 'ai_productivity', label: 'Want AI help drafting, summarizing, or analyzing work', bumpsPackageTo: 'ai',
    customerLabel: 'We want AI help with everyday work — drafting documents, summarizing meetings, analyzing spreadsheets',
    customerDescription: 'Microsoft Copilot works inside Word, Excel, Outlook, and Teams to help draft content, summarize long email threads or meetings, and answer questions about your own files.',
  },
  {
    key: 'collaboration', label: 'Team collaboration, meetings, or calling pain points', bumpsPackageTo: 'secure', alwaysConsult: true, consultLabel: 'Advanced Teams calling/meeting add-ons (not in current catalog) — confirm exact needs',
    customerLabel: 'Our team meetings, calls, or day-to-day collaboration could be smoother',
    customerDescription: "This usually comes down to a short conversation about your specific setup (number of meeting rooms, whether you need phone-system calling, etc.) — we'll follow up directly rather than guess here.",
  },
  {
    key: 'backup_compliance', label: 'Backup, data retention, or compliance/eDiscovery needs', alwaysConsult: true, consultLabel: 'Backup & compliance scope (not in current catalog) — needs its own conversation',
    customerLabel: 'We need to keep records for legal/regulatory reasons, or worry about losing data permanently',
    customerDescription: "Backup and compliance requirements vary a lot by industry and country, so this is best discussed directly rather than answered with a generic checkbox.",
  },
  {
    key: 'other', label: 'Something else (explain below)', alwaysConsult: true, consultLabel: 'Custom requirement — see notes',
    customerLabel: "Something else that isn't listed above",
    customerDescription: 'Tell us in your own words below — a specialist will follow up.',
  },
]

// Plain-language explanations — shown as helper subtext on the customer-facing
// form (and as muted hints internally too), so someone with no Microsoft
// licensing background can answer accurately without calling a rep first.
export const DISCOVERY_PAIN_POINT_HELP: Record<string, string> = {
  email_security: 'Suspicious emails, fake invoices, or attempts to trick staff into clicking malicious links or sharing passwords.',
  device_security: 'If a laptop or phone with company email/files is lost or stolen, can it be remotely locked or wiped?',
  shadow_it: 'Staff signing up for random apps/tools with their work email that IT doesn\'t know about or control.',
  manual_processes: 'Things like manually forwarding approvals, copying data between spreadsheets, or repetitive admin tasks that eat up time.',
  custom_apps: 'A simple internal tool — like a request form, tracker, or approval app — built without hiring a developer.',
  device_management: 'Being able to push security settings, require passcodes, or remotely manage laptops/phones used for work.',
  ai_productivity: 'An AI assistant built into Word, Excel, Outlook and Teams — drafts emails, summarizes long documents, and helps analyze spreadsheets.',
  collaboration: 'Video calls, meeting scheduling, or chat tools not working smoothly for a remote/hybrid team.',
  backup_compliance: 'Needing to keep records for a set period (e.g. for regulators or legal reasons), or recover deleted data reliably.',
  other: 'Anything not covered above — tell us in your own words below.',
}

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
