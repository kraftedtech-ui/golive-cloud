/**
 * commissionMath.ts: turns a published rate into naira. CLIENT-SAFE (pure), so
 * the admin form previews exactly what the server will record.
 *
 * Rates are written the way partners read them:
 *   "3%"                                        flat
 *   "6% below ₦5m; 8% from ₦5m to ₦20m; 10% above ₦20m"   banded on contract value
 *   "10% (domain registrations excluded)"       notes in brackets are ignored
 *   "No commission" / "Available once ..."      nothing payable
 * Bands are chosen on the CONTRACT value (the deal's size), and the chosen
 * percentage is then applied to the amount actually received (clause 5.2).
 */

export type ParsedRate = { pct: number | null; band?: string; reason?: string }

const unit = (n: string, u?: string) => {
  const v = parseFloat(n.replace(/,/g, ''))
  const m = (u || '').toLowerCase()
  return m === 'bn' || m === 'b' ? v * 1e9 : m === 'm' ? v * 1e6 : m === 'k' ? v * 1e3 : v
}
const MONEY = String.raw`\u20a6?\s*([\d.,]+)\s*(bn|b|m|k)?`

export function parseRate(text: string, contractValue?: number): ParsedRate {
  const t = String(text || '').replace(/\([^)]*\)/g, '').trim()
  if (!t) return { pct: null, reason: 'No rate' }
  if (/no commission|available once|\[rate\]/i.test(t)) return { pct: null, reason: t }
  const parts = t.split(/;\s*/).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 1 && /^\d+(\.\d+)?\s*%$/.test(parts[0])) return { pct: parseFloat(parts[0]) / 100 }
  if (typeof contractValue !== 'number' || !(contractValue >= 0)) return { pct: null, reason: 'Banded rate: enter the contract value to choose the band' }
  for (const p of parts) {
    const pct = /^(\d+(?:\.\d+)?)\s*%/.exec(p)
    if (!pct) continue
    const rate = parseFloat(pct[1]) / 100
    const below = new RegExp(`below\\s+${MONEY}`, 'i').exec(p)
    const from = new RegExp(`from\\s+${MONEY}\\s+to\\s+${MONEY}`, 'i').exec(p)
    const above = new RegExp(`above\\s+${MONEY}`, 'i').exec(p)
    if (below && contractValue < unit(below[1], below[2])) return { pct: rate, band: p }
    if (from && contractValue >= unit(from[1], from[2]) && contractValue <= unit(from[3], from[4])) return { pct: rate, band: p }
    if (above && contractValue > unit(above[1], above[2])) return { pct: rate, band: p }
    if (!below && !from && !above) return { pct: rate, band: p }
  }
  return { pct: null, reason: `No band in "${t}" matches a contract value of \u20a6${contractValue.toLocaleString('en-NG')}` }
}

/**
 * Clause 5.2: where GoLive earns less than the line's usual margin (a
 * low-margin product or a discount), commission is limited to the same share
 * of the margin actually earned.
 */
export function applyMarginLimit(pct: number, actualMargin?: number | null, usualMargin?: number | null): { pct: number; limited: boolean } {
  if (typeof actualMargin !== 'number' || typeof usualMargin !== 'number' || usualMargin <= 0) return { pct, limited: false }
  if (actualMargin >= usualMargin) return { pct, limited: false }
  const limited = Math.max(0, pct * (actualMargin / usualMargin))
  return { pct: limited, limited: true }
}

export const round2 = (n: number) => Math.round(n * 100) / 100

export function computeCommission(amount: number, pct: number, whtRate: number) {
  const gross = round2(amount * pct)
  const wht = round2(gross * whtRate)
  return { gross, wht, net: round2(gross - wht) }
}

export const pctText = (p: number) => `${Number((p * 100).toFixed(3))}%`
