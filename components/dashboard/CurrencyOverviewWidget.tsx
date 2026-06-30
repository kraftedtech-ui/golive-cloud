'use client'
import { useState, useEffect, useMemo } from 'react'
import { SUPPORTED_CURRENCIES, convertToUSD, convertFromUSD, fmtCurrency } from '@/lib/currency'

interface CustomerLite { mrr?: number; currency?: string; status: string }

export default function CurrencyOverviewWidget() {
  const [customers, setCustomers] = useState<CustomerLite[]>([])
  const [fxRates, setFxRates] = useState<Record<string, number>>({ NGN: 1 })
  const [fxAge, setFxAge] = useState<string | null>(null)
  const [displayCurrency, setDisplayCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/exchange-rates').then(r => r.json()),
    ]).then(([customersData, fxData]) => {
      setCustomers(customersData?.customers || [])
      if (fxData?.success) {
        setFxRates(fxData.rates || { NGN: 1 })
        setFxAge(fxData.fetchedAt || null)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const active = customers.filter(c => c.status !== 'churned')

  const totalMrrUSD = useMemo(() => active.reduce((sum, c) => sum + convertToUSD(c.mrr || 0, c.currency || 'USD', fxRates), 0), [active, fxRates])
  const totalArrUSD = totalMrrUSD * 12
  const displayMrr = convertFromUSD(totalMrrUSD, displayCurrency, fxRates)
  const displayArr = convertFromUSD(totalArrUSD, displayCurrency, fxRates)

  const byCurrency = useMemo(() => {
    const map: Record<string, { count: number; nativeMrr: number }> = {}
    for (const c of active) {
      const cur = c.currency || 'USD'
      if (!map[cur]) map[cur] = { count: 0, nativeMrr: 0 }
      map[cur].count += 1
      map[cur].nativeMrr += c.mrr || 0
    }
    return map
  }, [active])

  return (
    <section className="rounded-2xl border border-[#e3e9f0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0096c7]">Admin Only</p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[#0d2233]">Earnings Overview — All Currencies</h2>
          <p className="text-xs text-[#5c7184]">
            {active.length} active customers, billed across {Object.keys(byCurrency).length} currenc{Object.keys(byCurrency).length === 1 ? 'y' : 'ies'}.
            {fxAge && <span> FX as of {new Date(fxAge).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.</span>}
          </p>
        </div>
        <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}
          className="h-9 rounded-lg border border-[#e3e9f0] bg-white px-3 text-sm text-[#0d2233] outline-none focus:border-[#0096c7] focus:ring-2 focus:ring-[#0096c7]/30">
          {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>View in {c}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[#5c7184]">Loading…</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f4fafd] p-4">
              <p className="text-xs font-medium text-[#5c7184]">Total MRR</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#0d2233]">{fmtCurrency(displayMrr, displayCurrency)}</p>
            </div>
            <div className="rounded-xl bg-[#f4fafd] p-4">
              <p className="text-xs font-medium text-[#5c7184]">Total ARR</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#0d2233]">{fmtCurrency(displayArr, displayCurrency)}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c7184] mb-2">Currency mix (native amounts, not converted)</p>
            <div className="space-y-1.5">
              {Object.entries(byCurrency).map(([cur, info]) => (
                <div key={cur} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                  <span className="font-medium text-[#0d2233]">{cur} <span className="font-normal text-[#5c7184]">— {info.count} customer{info.count !== 1 ? 's' : ''}</span></span>
                  <span className="font-semibold text-[#0d2233]">{fmtCurrency(info.nativeMrr, cur)}/mo</span>
                </div>
              ))}
              {Object.keys(byCurrency).length === 0 && (
                <p className="text-xs text-[#5c7184] italic">No active customers yet.</p>
              )}
            </div>
          </div>

          <p className="mt-3 text-[10px] text-[#5c7184]">
            Converted using the same live FX feed as the rest of the portal. This view is intentionally admin-only — reps see currency conversion scoped to their own deals in Commissions and the Proposal Generator.
          </p>
        </>
      )}
    </section>
  )
}
