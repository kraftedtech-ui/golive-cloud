'use client'
import { useState, useEffect, useCallback } from 'react'
import { fmtCurrency } from '@/lib/currency'

interface CatalogResult {
  _id: string
  skuTitle: string
  termDuration: string
  billingPlan: string
  retailUSD: number
  marginPercent: number
  solutionArea?: string
}

interface Line extends CatalogResult {
  qty: number
}

const TERM_LABEL: Record<string, string> = { P1M: '1 month', P1Y: '1 year', P3Y: '3 years' }

export default function SkuMarginPicker({
  open,
  onClose,
  onApply,
  customerType = 'corporate',
}: {
  open: boolean
  onClose: () => void
  onApply: (marginPercent: number, summary: string) => void
  customerType?: 'corporate' | 'academic' | 'charity'
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<CatalogResult[]>([])
  const [searching, setSearching] = useState(false)
  const [lines, setLines] = useState<Line[]>([])

  const search = useCallback(async () => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const params = new URLSearchParams({ q: q.trim(), customerType, limit: '15' })
      const res = await fetch(`/api/pricing-catalog?${params.toString()}`)
      const data = await res.json()
      setResults(Array.isArray(data?.items) ? data.items : [])
    } catch (e) { console.error(e) }
    finally { setSearching(false) }
  }, [q, customerType])

  useEffect(() => {
    const t = setTimeout(search, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!open) { setQ(''); setResults([]); setLines([]) }
  }, [open])

  if (!open) return null

  function addLine(item: CatalogResult) {
    if (lines.some(l => l._id === item._id)) return
    setLines(prev => [...prev, { ...item, qty: 1 }])
    setQ('')
    setResults([])
  }

  function setQty(id: string, qty: number) {
    setLines(prev => prev.map(l => (l._id === id ? { ...l, qty: Math.max(1, qty) } : l)))
  }

  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l._id !== id))
  }

  const totalRevenue = lines.reduce((sum, l) => sum + l.retailUSD * l.qty, 0)
  const totalMargin = lines.reduce((sum, l) => sum + l.retailUSD * l.qty * l.marginPercent, 0)
  const blendedMargin = totalRevenue > 0 ? totalMargin / totalRevenue : 0

  function apply() {
    if (lines.length === 0) return
    const summary = lines.map(l => `${l.qty}× ${l.skuTitle} (${l.billingPlan})`).join(' + ')
    onApply(Math.round(blendedMargin * 1000) / 10, summary) // one decimal place
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-foreground">Build margin from catalog</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Add the SKUs that make up this deal — margin % is pulled from the live distributor pricelist instead of a guess.
        </p>

        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU (e.g. Business Premium, Dynamics 365 Customer Insights)…"
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          {q.trim() && (
            <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
              {searching ? (
                <p className="px-3 py-2.5 text-xs text-muted-foreground">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-muted-foreground">No matching SKUs.</p>
              ) : results.map((item) => (
                <button
                  key={item._id}
                  onClick={() => addLine(item)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-secondary/40"
                >
                  <span>
                    <span className="font-medium text-foreground">{item.skuTitle}</span>
                    <span className="text-muted-foreground"> · {TERM_LABEL[item.termDuration] || item.termDuration} · {item.billingPlan}</span>
                  </span>
                  <span className="flex-shrink-0 font-medium text-foreground">{fmtCurrency(item.retailUSD, 'USD')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground italic">No SKUs added yet.</p>
          ) : lines.map((l) => (
            <div key={l._id} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{l.skuTitle}</p>
                <p className="text-[11px] text-muted-foreground">{TERM_LABEL[l.termDuration] || l.termDuration} · {l.billingPlan} · {fmtCurrency(l.retailUSD, 'USD')}/unit</p>
              </div>
              <input
                type="number"
                min={1}
                value={l.qty}
                onChange={(e) => setQty(l._id, parseInt(e.target.value) || 1)}
                className="w-14 rounded-md border border-border bg-white px-1.5 py-1 text-center text-[11px]"
              />
              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.marginPercent >= 0.1 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {(l.marginPercent * 100).toFixed(1)}%
              </span>
              <button onClick={() => removeLine(l._id)} className="text-muted-foreground hover:text-red-500">✕</button>
            </div>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Blended margin across {lines.reduce((s, l) => s + l.qty, 0)} unit(s)</p>
              <p className="text-sm font-bold text-primary">{(blendedMargin * 100).toFixed(1)}%</p>
            </div>
            <p className="text-[11px] text-muted-foreground text-right">Total catalog value<br /><span className="font-medium text-foreground">{fmtCurrency(totalRevenue, 'USD')}</span></p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/40">
            Cancel
          </button>
          <button
            onClick={apply}
            disabled={lines.length === 0}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Use this margin ({(blendedMargin * 100).toFixed(1)}%)
          </button>
        </div>
      </div>
    </div>
  )
}
