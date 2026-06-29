"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type CurrencyCode = "USD" | "NGN" | "GHS" | "KES" | "ZAR"

type CurrencyInfo = {
  code: CurrencyCode
  symbol: string
  label: string
  rate: number
}

// The `rate` fields below are now only a fallback for if live rates fail to
// load — real conversion uses liveRates (NGN per 1 unit of currency, same
// feed the internal portal uses), passed in from the server.
export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$",   label: "🇺🇸 USD — US Dollar",           rate: 1 },
  NGN: { code: "NGN", symbol: "₦",   label: "🇳🇬 NGN — Nigerian Naira",      rate: 1600 },
  GHS: { code: "GHS", symbol: "GH₵", label: "🇬🇭 GHS — Ghanaian Cedi",       rate: 15 },
  KES: { code: "KES", symbol: "KSh", label: "🇰🇪 KES — Kenyan Shilling",      rate: 129 },
  ZAR: { code: "ZAR", symbol: "R",   label: "🇿🇦 ZAR — South African Rand",   rate: 18 },
}

type CurrencyContextValue = {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  format: (usd: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children, liveRates }: { children: ReactNode; liveRates?: Record<string, number> }) {
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  const value = useMemo<CurrencyContextValue>(() => {
    const info = CURRENCIES[currency]
    return {
      currency,
      setCurrency,
      format: (usd: number) => {
        // liveRates are NGN-per-unit (e.g. liveRates.USD = how many NGN per $1).
        // Converting USD -> target currency: usd * liveRates.USD / liveRates[target].
        const usdToNgn = liveRates?.USD
        const targetToNgn = liveRates?.[currency]
        const converted = usdToNgn && targetToNgn ? (usd * usdToNgn) / targetToNgn : usd * info.rate
        const rounded = currency === "USD" ? converted : Math.round(converted)
        const formatted = rounded.toLocaleString("en-US", { maximumFractionDigits: currency === "USD" ? 2 : 0 })
        return `${info.symbol}${formatted}`
      },
    }
  }, [currency, liveRates])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx
}
