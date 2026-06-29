import { connectDB } from './mongodb'
import { ProductMapping } from '@/models/ProductMapping'
import { PricingCatalog } from '@/models/PricingCatalog'
import { getExchangeRates } from './exchangeRates'

export interface PublicPackage {
  key: string
  name: string
  priceUsd: number | null // null = "Custom" / talk to sales
  setupFeeUsd: number | null
  features: string[]
  featured: boolean
}

// Setup fees aren't in the catalog (they're a GoLive service fee, not a
// Microsoft SKU) — kept here as the one small piece of data this layer still
// owns directly, rather than buried in two different page files.
const SETUP_FEES_USD: Record<string, number | null> = { starter: 150, secure: 300, ai: null }
const CUSTOM_PRICING_KEYS = new Set(['ai'])
const FEATURED_KEYS = new Set(['secure'])

// Used only if the database is unreachable — keeps the public site from ever
// rendering blank/broken, at the cost of not reflecting the latest catalog.
const FALLBACK_PACKAGES: PublicPackage[] = [
  { key: 'starter', name: 'Starter Cloud Office', priceUsd: 6, setupFeeUsd: 150, featured: false,
    features: ['Microsoft 365 Business Basic', 'Custom domain business email', '1 TB OneDrive per user', 'Teams, Word, Excel & PowerPoint (web)', 'Local currency billing', 'Email & chat support'] },
  { key: 'secure', name: 'Secure Business Cloud', priceUsd: 22, setupFeeUsd: 300, featured: true,
    features: ['Microsoft 365 Business Premium', 'Microsoft Defender for Business', 'Desktop Office apps + 1 TB storage', 'Intune device management & MFA', 'Data loss prevention & encryption', 'Priority support + onboarding'] },
  { key: 'ai', name: 'AI-Ready Enterprise', priceUsd: null, setupFeeUsd: null, featured: false,
    features: ['Microsoft 365 Business Premium + Copilot', 'Copilot in Word, Excel, PowerPoint, Outlook & Teams', 'Microsoft Defender for Business', 'MFA & Conditional Access', 'Premium managed support'] },
]

const FALLBACK_RATES: Record<string, number> = { NGN: 1, USD: 1600, GHS: 105, KES: 12, ZAR: 88 }

/**
 * Real package pricing for public marketing pages (landing page, /migrate),
 * sourced from the same Product Mapping + Pricing Catalog data the internal
 * Proposal Generator uses — so the public site can no longer drift out of
 * sync the way it did with the old hardcoded $6/$22/Custom arrays.
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
    const rows = await PricingCatalog.find({
      skuTitle: { $in: allSkus },
      customerType: 'corporate',
      termDuration: 'P1Y',
      billingPlan: 'Annual',
      active: true,
    }).lean()

    return mappings.map((m: any) => {
      const annualUsd = (m.skuTitles as string[]).reduce(
        (sum, sku) => sum + (rows.find((r: any) => r.skuTitle === sku)?.retailUSD || 0),
        0
      )
      return {
        key: m.key,
        name: m.label,
        priceUsd: CUSTOM_PRICING_KEYS.has(m.key) || annualUsd === 0 ? null : Math.round((annualUsd / 12) * 100) / 100,
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
