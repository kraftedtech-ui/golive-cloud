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
