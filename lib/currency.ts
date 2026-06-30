export const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'GHS', 'KES', 'ZAR'] as const
export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]

export const CURRENCY_BY_COUNTRY: Record<string, CurrencyCode> = {
  Nigeria: 'NGN',
  Ghana: 'GHS',
  Kenya: 'KES',
  'South Africa': 'ZAR',
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  NGN: '₦',
  GHS: 'GH₵',
  KES: 'KSh',
  ZAR: 'R',
}

/** Best-guess currency for a lead/customer based on country. Falls back to USD for anything not in the map (e.g. "Other"). */
export function currencyForCountry(country?: string): CurrencyCode {
  return (country && CURRENCY_BY_COUNTRY[country]) || 'USD'
}

export function fmtCurrency(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' '
  return sym + Math.round(amount).toLocaleString('en-US')
}

/**
 * Converts a USD amount into any supported currency using the NGN-based
 * rates map from getExchangeRates() (rates are "NGN per 1 unit of currency").
 * Used by the Proposal Generator, since the distributor pricelist is USD.
 */
export function convertFromUSD(amountUSD: number, targetCurrency: string, ratesNGNPerUnit: Record<string, number>): number {
  const usdToNgn = ratesNGNPerUnit['USD'] ?? 1
  const targetToNgn = ratesNGNPerUnit[targetCurrency] ?? 1
  if (!targetToNgn) return amountUSD
  return (amountUSD * usdToNgn) / targetToNgn
}

/** Inverse of convertFromUSD — used when a rep types a value directly into a
 * field that's displayed in the selected currency but needs to be stored
 * against a stable USD base (e.g. the Proposal Generator's setup fee), so the
 * figure converts correctly if the currency dropdown changes afterward. */
export function convertToUSD(amount: number, fromCurrency: string, ratesNGNPerUnit: Record<string, number>): number {
  const usdToNgn = ratesNGNPerUnit['USD'] ?? 1
  const fromToNgn = ratesNGNPerUnit[fromCurrency] ?? 1
  if (!usdToNgn) return amount
  return (amount * fromToNgn) / usdToNgn
}

/**
 * Sums MRR across customers who may each be billed in a different currency
 * (Customer.currency is per-record, not global) — converts every figure to
 * USD first via the live FX feed, rather than naively adding raw numbers
 * that could be a mix of NGN, GHS, USD, etc.
 */
export function sumMrrAsUSD(customers: { mrr?: number; currency?: string }[], ratesNGNPerUnit: Record<string, number>): number {
  return customers.reduce((sum, c) => sum + convertToUSD(c.mrr || 0, c.currency || 'USD', ratesNGNPerUnit), 0)
}
