"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type CurrencyCode = "USD" | "NGN" | "GHS" | "KES" | "ZAR"

type CurrencyInfo = {
  code: CurrencyCode
  symbol: string
  label: string
  rate: number
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", label: "USD — US Dollar", rate: 1 },
  NGN: { code: "NGN", symbol: "₦", label: "NGN — Nigerian Naira", rate: 1600 },
  GHS: { code: "GHS", symbol: "GH₵", label: "GHS — Ghanaian Cedi", rate: 15 },
  KES: { code: "KES", symbol: "KSh", label: "KES — Kenyan Shilling", rate: 129 },
  ZAR: { code: "ZAR", symbol: "R", label: "ZAR — South African Rand", rate: 18 },
}

type CurrencyContextValue = {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  format: (usd: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  const value = useMemo<CurrencyContextValue>(() => {
    const info = CURRENCIES[currency]
    return {
      currency,
      setCurrency,
      format: (usd: number) => {
        const converted = usd * info.rate
        const rounded = info.rate === 1 ? converted : Math.round(converted)
        const formatted = rounded.toLocaleString("en-US", { maximumFractionDigits: 0 })
        return `${info.symbol}${formatted}`
      },
    }
  }, [currency])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx
}
