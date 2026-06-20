import { connectDB } from '@/lib/mongodb'
import { ExchangeRate } from '@/models/ExchangeRate'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'

const STALE_MS = 6 * 60 * 60 * 1000 // refresh at most every 6 hours

// Conservative fallback in case the live API is unreachable on a cold start
// and no document exists yet. Should be corrected via manual override if used.
const FALLBACK_RATES: Record<string, number> = { NGN: 1, USD: 1600, GHS: 105, KES: 12, ZAR: 88 }

async function fetchLiveRates(): Promise<Record<string, number> | null> {
  try {
    // Free, no-API-key endpoint. Returns rates relative to USD.
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
    const data = await res.json()
    if (data?.result !== 'success' || !data?.rates?.NGN) return null

    const usdPerNgn = data.rates.NGN
    const ngnRates: Record<string, number> = { NGN: 1 }
    for (const code of SUPPORTED_CURRENCIES) {
      if (code === 'NGN') continue
      const usdPerCode = data.rates[code]
      if (usdPerCode) {
        // 1 unit of `code` is worth (usdPerNgn / usdPerCode) NGN
        ngnRates[code] = usdPerNgn / usdPerCode
      }
    }
    return ngnRates
  } catch (err) {
    console.error('Live FX fetch failed:', err)
    return null
  }
}

export async function getExchangeRates(): Promise<{
  rates: Record<string, number>
  source: 'live' | 'manual'
  fetchedAt: Date
}> {
  await connectDB()
  let doc = await ExchangeRate.findOne({})
  const isStale = !doc || Date.now() - new Date(doc.fetchedAt).getTime() > STALE_MS

  if (isStale && !doc?.locked) {
    const live = await fetchLiveRates()
    if (live) {
      doc = await ExchangeRate.findOneAndUpdate(
        {},
        { rates: live, source: 'live', fetchedAt: new Date() },
        { upsert: true, new: true }
      )
    }
  }

  if (!doc) {
    doc = await ExchangeRate.create({ rates: FALLBACK_RATES, source: 'manual', fetchedAt: new Date() })
  }

  return { rates: doc.rates as Record<string, number>, source: doc.source, fetchedAt: doc.fetchedAt }
}

/** Converts an amount in `currency` into NGN using the given rates map (NGN per 1 unit of currency). */
export function convertToNGN(amount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1
  return amount * rate
}
