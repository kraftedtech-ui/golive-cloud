'use client'
import { useState, useEffect, useCallback } from 'react'

export interface CatalogRow {
  _id: string
  skuTitle: string
  termDuration: string
  billingPlan: string
  retailUSD: number
  marginUSD: number
  marginPercent: number
  customerType?: string
  solutionArea?: string
}

export interface CatalogLine extends CatalogRow {
  qty: number
  /** Rep-entered unit price in USD. Undefined = use catalog retail. */
  overrideUSD?: number
}

const TERM_LABEL: Record<string, string> = { P1M: '1 month', P1Y: '1 year', P3Y: '3 years' }

const CUSTOMER_TYPES = [
  { value: 'corporate', label: 'Commercial' },
  { value: 'charity', label: 'Non-profit / Charity' },
  { value: 'academic', label: 'Education' },
]

/** How many times a year this term/billing combination is actually charged. */
export function periodsPerYearFor(billingPlan: string): number {
  return billingPlan === 'Monthly' ? 12 : 1
}

/** Effective unit price for a line, honouring any override. */
export function unitUSD(l: CatalogLine): number {
  return l.overrideUSD !== undefined && !isNaN(l.overrideUSD) ? l.overrideUSD : l.retailUSD
}

/** Reseller cost per unit — catalog retail minus catalog margin. */
export function costUSD(l: CatalogRow): number {
  return l.retailUSD - l.marginUSD
}

/** Margin fraction for a line after any override. Can be negative. */
export function lineMargin(l: CatalogLine): number {
  const u = unitUSD(l)
  if (u <= 0) return 0
  return (u - costUSD(l)) / u
}

/** Annualised total for a line, in USD. */
export function lineAnnualUSD(l: CatalogLine): number {
  return unitUSD(l) * l.qty * periodsPerYearFor(l.billingPlan)
}

const MARGIN_FLOOR = 0.05

export default function CatalogLinePicker({
  open,
  onClose,
  onApply,
  existing = [],
  isAdmin = false,
}: {
  open: boolean
  onClose: () => void
  onApply: (lines: CatalogLine[]) => void
  existing?: CatalogLine[]
  isAdmin?: boolean
}) {
  const [q, setQ] = useState('')
  const [customerType, setCustomerType] = useState('corporate')
  const [solutionArea, setSolutionArea] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [results, setResults] = useState<CatalogRow[]>([])
  const [searching, setSearching] = useState(false)
  const [lines, setLines] = useState<CatalogLine[]>([])

  useEffect(() => {
    if (!open) return
    setLines(existing)
    fetch('/api/pricing-catalog?distinct=solutionArea')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.solutionAreas)) setAreas(d.solutionAreas) })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const search = useCallback(async () => {
    if (!open) return
    setSearching(true)
    try {
      const params = new URLSearchParams({ customerType, limit: q.trim() ? '25' : '40' })
      if (q.trim()) params.set('q', q.trim())
      if (solutionArea) params.set('solutionArea', solutionArea)
      const res = await fetch(`/api/pricing-catalog?${params.toString()}`)
      const data = await res.json()
      setResults(Array.isArray(data?.items) ? data.items : [])
    } catch (e) { console.error(e) }
    finally { setSearching(false) }
  }, [q, customerType, solutionArea, open])

  useEffect(() => {
    const t = setTimeout(search, 300)
    return () => clearTimeout(t)
  }, [search])

  if (!open) return null

  function addLine(row: CatalogRow) {
    if (lines.some(l => l._id === row._id)) return
    setLines(prev => [...prev, { ...row, qty: 1 }])
  }
  function setQty(id: string, qty: number) {
    setLines(prev => prev.map(l => (l._id === id ? { ...l, qty: Math.max(1, qty) } : l)))
  }
  function setOverride(id: string, raw: string) {
    setLines(prev => prev.map(l => {
      if (l._id !== id) return l
      if (raw.trim() === '') { const { overrideUSD, ...rest } = l; return rest as CatalogLine }
      const n = parseFloat(raw)
      return { ...l, overrideUSD: isNaN(n) ? undefined : n }
    }))
  }
  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l._id !== id))
  }

  const totalAnnual = lines.reduce((s, l) => s + lineAnnualUSD(l), 0)
  const totalCostAnnual = lines.reduce((s, l) => s + costUSD(l) * l.qty * periodsPerYearFor(l.billingPlan), 0)
  const blended = totalAnnual > 0 ? (totalAnnual - totalCostAnnual) / totalAnnual : 0
  const anyThin = lines.some(l => lineMargin(l) < MARGIN_FLOOR)

  const inp = 'rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Add licences from catalog</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Anything in the distributor pricelist can be quoted here — not just the packaged bundles. Each line keeps its own term and billing plan.
        </p>

        <div className="mb-2 grid grid-cols-[1fr_150px_150px] gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search SKU… e.g. Business Standard, Power BI, Intune" className={inp + ' w-full'} />
          <select value={customerType} onChange={e => setCustomerType(e.target.value)} className={inp}>
            {CUSTOMER_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={solutionArea} onChange={e => setSolutionArea(e.target.value)} className={inp}>
            <option value="">All areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {customerType !== 'corporate' && (
          <p className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-800">
            ⚠ Showing <strong>{CUSTOMER_TYPES.find(c => c.value === customerType)?.label}</strong> pricing. The customer must be eligible and verified with Microsoft before this can be provisioned.
          </p>
        )}

        <div className="max-h-44 overflow-y-auto rounded-lg border border-border">
          {searching ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">No matching SKUs.</p>
          ) : results.map(row => {
            const already = lines.some(l => l._id === row._id)
            return (
              <button
                key={row._id}
                onClick={() => addLine(row)}
                disabled={already}
                className={`flex w-full items-center justify-between gap-2 border-b border-border/50 px-3 py-2 text-left text-xs last:border-b-0 ${already ? 'opacity-40' : 'hover:bg-secondary/40'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{row.skuTitle}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {TERM_LABEL[row.termDuration] || row.termDuration} term · billed {row.billingPlan.toLowerCase()}
                    {row.termDuration === 'P1Y' && row.billingPlan === 'Monthly' && <span className="text-amber-600"> · 12-month commitment</span>}
                  </span>
                </span>
                <span className="flex-shrink-0 text-right">
                  <span className="font-medium text-foreground">${row.retailUSD.toFixed(2)}</span>
                  {isAdmin && <span className="block text-[10px] text-muted-foreground">{(row.marginPercent * 100).toFixed(1)}% margin</span>}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="py-4 text-center text-xs italic text-muted-foreground">No lines added yet.</p>
          ) : lines.map(l => {
            const m = lineMargin(l)
            const thin = m < MARGIN_FLOOR
            return (
              <div key={l._id} className={`rounded-lg border px-2.5 py-2 text-xs ${thin ? 'border-amber-300 bg-amber-50/50' : 'border-border'}`}>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{l.skuTitle}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {TERM_LABEL[l.termDuration] || l.termDuration} · billed {l.billingPlan.toLowerCase()} · list ${l.retailUSD.toFixed(2)}
                    </p>
                  </div>
                  <label className="flex flex-shrink-0 items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Qty</span>
                    <input type="number" min={1} value={l.qty} onChange={e => setQty(l._id, parseInt(e.target.value) || 1)} className="w-12 rounded-md border border-border px-1 py-0.5 text-center text-[11px]" />
                  </label>
                  <label className="flex flex-shrink-0 items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={l.overrideUSD ?? ''}
                      placeholder={l.retailUSD.toFixed(2)}
                      onChange={e => setOverride(l._id, e.target.value)}
                      className="w-16 rounded-md border border-border px-1 py-0.5 text-center text-[11px]"
                    />
                  </label>
                  {isAdmin && (
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m < 0 ? 'bg-red-100 text-red-700' : thin ? 'bg-amber-100 text-amber-800' : 'bg-green-50 text-green-700'}`}>
                      {(m * 100).toFixed(1)}%
                    </span>
                  )}
                  <button onClick={() => removeLine(l._id)} className="flex-shrink-0 text-muted-foreground hover:text-red-500">✕</button>
                </div>
                {thin && (
                  <p className={`mt-1 text-[10px] ${m < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                    {m < 0
                      ? `⚠ Below cost — you would lose $${(costUSD(l) - unitUSD(l)).toFixed(2)} per unit.`
                      : `⚠ Thin margin — cost is $${costUSD(l).toFixed(2)} per unit.`}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {lines.length > 0 && (
          <div className={`mt-3 flex items-center justify-between rounded-lg border px-3 py-2.5 ${anyThin ? 'border-amber-200 bg-amber-50' : 'border-primary/20 bg-primary/5'}`}>
            <div>
              <p className="text-[11px] text-muted-foreground">{lines.length} line{lines.length !== 1 ? 's' : ''} · annualised</p>
              <p className="text-sm font-bold text-primary">${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            {isAdmin && (
              <p className="text-right text-[11px] text-muted-foreground">
                Blended margin<br />
                <span className={`font-semibold ${blended < 0 ? 'text-red-600' : blended < MARGIN_FLOOR ? 'text-amber-700' : 'text-foreground'}`}>{(blended * 100).toFixed(1)}%</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/40">Cancel</button>
          <button onClick={() => { onApply(lines); onClose() }} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            {lines.length === 0 ? 'Clear lines' : `Add ${lines.length} line${lines.length !== 1 ? 's' : ''} to proposal`}
          </button>
        </div>
      </div>
    </div>
  )
}
