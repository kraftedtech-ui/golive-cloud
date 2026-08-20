import { connectDB } from './mongodb'
import { ProductMapping } from '@/models/ProductMapping'
import { PricingCatalog } from '@/models/PricingCatalog'
import { getExchangeRates } from './exchangeRates'

export interface PublicPackage {
  key: string
  name: string
  /**
   * Annual commitment, billed upfront, expressed per user per month.
   * Kept as `priceUsd` for backwards compatibility with existing callers.
   */
  priceUsd: number | null // null = "Custom" / talk to sales
  /** Annual commitment, billed monthly — same term, spread payment. */
  annualBilledMonthlyUsd: number | null
  /** Monthly commitment — cancel anytime, ~20% premium. */
  monthlyCommitUsd: number | null
  setupFeeUsd: number | null
  features: string[]
  featured: boolean
}

// Setup fees aren't in the catalog (they're a GoLive service fee, not a
// Microsoft SKU) — kept here as the one small piece of data this layer still
// owns directly, rather than buried in two different page files.
const SETUP_FEES_USD: Record<string, number | null> = { starter: 150, standard: 200, secure: 300, ai: null }
const CUSTOM_PRICING_KEYS = new Set(['ai'])
const FEATURED_KEYS = new Set(['secure'])

// Used only if the database is unreachable — keeps the public site from ever
// rendering blank/broken, at the cost of not reflecting the latest catalog.
// Figures below match the 2026-08 catalog import; refresh them whenever list
// prices move, or an outage will quietly show last year's pricing.
const FALLBACK_PACKAGES: PublicPackage[] = [
  { key: 'starter', name: 'Starter Cloud Office', priceUsd: 7, annualBilledMonthlyUsd: 7.35, monthlyCommitUsd: 8.4, setupFeeUsd: 150, featured: false,
    features: ['Microsoft 365 Business Basic', 'Custom domain business email', '1 TB OneDrive per user', 'Teams, Word, Excel & PowerPoint (web)', 'Local currency billing', 'Email & chat support'] },
  { key: 'standard', name: 'Standard Cloud Office', priceUsd: 14, annualBilledMonthlyUsd: 14.7, monthlyCommitUsd: 16.8, setupFeeUsd: 200, featured: false,
    features: ['Microsoft 365 Business Standard', 'Desktop Office apps on up to 5 devices', 'Custom domain business email', '1 TB OneDrive per user', 'Teams, SharePoint & Exchange Online', 'Local currency billing', 'Email & chat support'] },
  { key: 'secure', name: 'Secure Business Cloud', priceUsd: 22, annualBilledMonthlyUsd: 23.1, monthlyCommitUsd: 26.4, setupFeeUsd: 300, featured: true,
    features: ['Microsoft 365 Business Premium', 'Microsoft Defender for Business', 'Desktop Office apps + 1 TB storage', 'Intune device management & MFA', 'Data loss prevention & encryption', 'Priority support + onboarding'] },
  { key: 'ai', name: 'AI-Ready Enterprise', priceUsd: null, annualBilledMonthlyUsd: null, monthlyCommitUsd: null, setupFeeUsd: null, featured: false,
    features: ['Microsoft 365 Business Premium + Copilot', 'Copilot in Word, Excel, PowerPoint, Outlook & Teams', 'Microsoft Defender for Business', 'MFA & Conditional Access', 'Premium managed support'] },
]

const FALLBACK_RATES: Record<string, number> = { NGN: 1, USD: 1600, GHS: 105, KES: 12, ZAR: 88 }

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Real package pricing for public marketing pages (landing page, /migrate),
 * sourced from the same Product Mapping + Pricing Catalog data the internal
 * Proposal Generator uses — so the public site can no longer drift out of
 * sync the way it did with the old hardcoded $6/$22/Custom arrays.
 *
 * Returns all three commitment prices rather than one. Showing only the
 * annual-upfront figure under a "/user/month" label understated what a
 * customer on monthly billing actually pays by roughly 20%, which is the
 * single most common complaint about how CSP pricing is advertised.
 *
 * Only ever returns public-safe fields: name, retail price, features. Never
 * margin, never reseller cost, never raw catalog SKU titles.
 */
export async function getPublicPackages(): Promise<PublicPackage[]> {
  try {
    await connectDB()
    const mappings = await ProductMapping.find({ type: 'package', active: true }).sort({ order: 1 }).lean()
    if (!mappings.length) return FALLBACK_PACKAGES

    const allSkus = Array.from(new Set(mappings.flatMap((m: any) => m.skuTitles as string[])))
    // No term/plan filter — we need every combination so the card can show
    // what each way of committing actually costs.
    const rows = await PricingCatalog.find({
      skuTitle: { $in: allSkus },
      customerType: 'corporate',
      billingPlan: { $ne: 'None' },
      active: true,
    }).lean()

    /** Sum retail across a package's SKUs for one term/billing combination. */
    const sumFor = (skus: string[], termDuration: string, billingPlan: string): number =>
      skus.reduce((sum, sku) => {
        const row = rows.find(
          (r: any) => r.skuTitle === sku && r.termDuration === termDuration && r.billingPlan === billingPlan
        )
        return sum + ((row as any)?.retailUSD || 0)
      }, 0)

    return mappings.map((m: any) => {
      const skus = m.skuTitles as string[]

      // Annual commitment paid upfront is quoted per year in the catalog.
      const annualUpfrontYear = sumFor(skus, 'P1Y', 'Annual')
      // The other two are already per-user-per-month figures.
      const annualBilledMonthly = sumFor(skus, 'P1Y', 'Monthly')
      const monthlyCommit = sumFor(skus, 'P1M', 'Monthly')

      const isCustom = CUSTOM_PRICING_KEYS.has(m.key) || annualUpfrontYear === 0

      return {
        key: m.key,
        name: m.label,
        priceUsd: isCustom ? null : round2(annualUpfrontYear / 12),
        annualBilledMonthlyUsd: isCustom || annualBilledMonthly === 0 ? null : round2(annualBilledMonthly),
        monthlyCommitUsd: isCustom || monthlyCommit === 0 ? null : round2(monthlyCommit),
        setupFeeUsd: SETUP_FEES_USD[m.key] ?? null,
        features: m.features || [],
        featured: FEATURED_KEYS.has(m.key),
      }
    })
  } catch (err) {
    console.error('getPublicPackages failed, using fallback:', err)
    return FALLBACK_PACKAGES
  }
}

/** Live NGN-per-unit FX rates for the public currency switcher — same feed the portal uses. */
export async function getPublicFxRates(): Promise<Record<string, number>> {
  try {
    const { rates } = await getExchangeRates()
    return rates
  } catch (err) {
    console.error('getPublicFxRates failed, using fallback:', err)
    return FALLBACK_RATES
  }
}
