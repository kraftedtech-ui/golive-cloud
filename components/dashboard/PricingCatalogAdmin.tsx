'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { fmtCurrency } from '@/lib/currency'

interface CatalogItem {
  _id: string
  skuTitle: string
  productId: string
  termDuration: string
  billingPlan: string
  customerType: string
  retailUSD: number
  resellerUSD: number
  marginUSD: number
  marginPercent: number
  solutionArea?: string
  importBatch: string
}

interface ImportSummary {
  batch: string
  parsedRows: number
  created: number
  updated: number
  deactivated: number
  activeTotal: number
  warnings: string[]
}

const TERM_LABEL: Record<string, string> = { P1M: '1 month', P1Y: '1 year', P3Y: '3 years' }

export default function PricingCatalogAdmin({ userRole }: { userRole: string }) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [total, setTotal] = useState(0)
  const [lastImport, setLastImport] = useState<{ batch: string; sourceFile?: string; at: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [customerType, setCustomerType] = useState('corporate')
  const [billingPlan, setBillingPlan] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportSummary | null>(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = userRole === 'admin'

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ customerType, limit: '200' })
      if (q.trim()) params.set('q', q.trim())
      if (billingPlan) params.set('billingPlan', billingPlan)
      const res = await fetch(`/api/pricing-catalog?${params.toString()}`)
      const data = await res.json()
      setItems(Array.isArray(data?.items) ? data.items : [])
      setTotal(data?.total || 0)
      setLastImport(data?.lastImport || null)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [q, customerType, billingPlan])

  // Debounce free-text search a little so we're not firing a request per keystroke.
  useEffect(() => {
    const t = setTimeout(fetchItems, 300)
    return () => clearTimeout(t)
  }, [fetchItems])

  async function handleImport(file: File) {
    setImporting(true)
    setImportError('')
    setImportResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/pricing-catalog/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) {
        setImportError(data.error || 'Import failed.')
      } else {
        setImportResult(data)
        fetchItems()
      }
    } catch {
      setImportError('Import failed — check your connection and try again.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Admin</p>
            <h2 className="mt-0.5 text-base font-semibold text-foreground">Pricing Catalog</h2>
            <p className="text-xs text-muted-foreground">
              4Sight Dynamics Africa CSP reference pricelist — {total.toLocaleString()} active SKU/term/plan combinations
              {lastImport && (
                <> · last import <span className="font-medium text-foreground">{lastImport.batch}</span> on{' '}
                  {new Date(lastImport.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </>
              )}
            </p>
          </div>
          {isAdmin && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f) }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {importing ? 'Importing…' : '⬆️ Import distributor pricelist (.xlsx)'}
              </button>
            </div>
          )}
        </div>

        {importError && (
          <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{importError}</div>
        )}
        {importResult && (
          <div className="mx-5 mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-800">
            <p className="font-semibold">Imported batch {importResult.batch}: {importResult.parsedRows} rows parsed
              ({importResult.created} new, {importResult.updated} updated, {importResult.deactivated} deactivated as stale).</p>
            {importResult.warnings.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-amber-700">
                {importResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border bg-secondary/20">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU (e.g. Business Premium, Copilot)…"
            className="flex-1 min-w-[220px] rounded-lg border border-input bg-card px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <select value={customerType} onChange={(e) => setCustomerType(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm outline-none">
            <option value="corporate">Corporate</option>
            <option value="academic">Academic</option>
            <option value="charity">Charity</option>
          </select>
          <select value={billingPlan} onChange={(e) => setBillingPlan(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm outline-none">
            <option value="">All billing plans</option>
            <option value="Monthly">Monthly</option>
            <option value="Annual">Annual</option>
            <option value="Triennial">Triennial</option>
          </select>
        </div>

        {/* Results */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">SKU</th>
                <th className="px-3 py-2.5 font-medium">Term</th>
                <th className="px-3 py-2.5 font-medium">Billing</th>
                <th className="px-3 py-2.5 font-medium text-right">Retail (USD)</th>
                <th className="px-3 py-2.5 font-medium text-right">Margin (USD)</th>
                <th className="px-3 py-2.5 font-medium text-right">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading catalog…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  {total === 0 ? 'No pricing data yet — import the distributor pricelist to get started.' : 'No SKUs match this search.'}
                </td></tr>
              ) : items.map((item) => (
                <tr key={item._id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-foreground">{item.skuTitle}</div>
                    {item.solutionArea && <div className="text-[11px] text-muted-foreground">{item.solutionArea}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{TERM_LABEL[item.termDuration] || item.termDuration}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{item.billingPlan}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-foreground">{fmtCurrency(item.retailUSD, 'USD')}</td>
                  <td className="px-3 py-2.5 text-right text-foreground">{fmtCurrency(item.marginUSD, 'USD')}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.marginPercent >= 0.1 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {(item.marginPercent * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 0 && items.length < total && (
          <p className="px-5 py-3 text-[11px] text-muted-foreground border-t border-border">
            Showing {items.length} of {total.toLocaleString()} — narrow your search to see more specific results.
          </p>
        )}
      </div>
    </div>
  )
}
