'use client'
import { useState, useEffect, useCallback } from 'react'
import { fmtCurrency } from '@/lib/currency'

interface CatalogRow { skuTitle: string; termDuration: string; billingPlan: string; retailUSD: number; marginPercent: number }
interface Mapping {
  _id: string
  type: 'package' | 'addon'
  key: string
  label: string
  skuTitles: string[]
  blurb?: string
  features?: string[]
  order: number
}

const emptyForm = { type: 'package' as 'package' | 'addon', key: '', label: '', skuTitlesText: '', blurb: '', featuresText: '', order: 0 }

export default function ProductMappingAdmin({ isAdmin }: { isAdmin: boolean }) {
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/product-mappings')
      const items: Mapping[] = await res.json()
      setMappings(Array.isArray(items) ? items : [])

      const allSkus = Array.from(new Set((items || []).flatMap(m => m.skuTitles)))
      if (allSkus.length > 0) {
        const params = new URLSearchParams({ skuTitles: allSkus.join(','), customerType: 'corporate', billingPlan: 'Annual', limit: '100' })
        const catRes = await fetch(`/api/pricing-catalog?${params.toString()}`)
        const catData = await catRes.json()
        setCatalogRows(Array.isArray(catData?.items) ? catData.items : [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function priceFor(skuTitle: string) {
    return catalogRows.find(r => r.skuTitle === skuTitle && r.termDuration === 'P1Y' && r.billingPlan === 'Annual')
  }

  function openCreate(type: 'package' | 'addon') {
    setForm({ ...emptyForm, type })
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  function openEdit(m: Mapping) {
    setForm({
      type: m.type, key: m.key, label: m.label,
      skuTitlesText: m.skuTitles.join('\n'),
      blurb: m.blurb || '',
      featuresText: (m.features || []).join('\n'),
      order: m.order,
    })
    setEditingId(m._id)
    setShowForm(true)
    setError('')
  }

  async function save() {
    if (!form.key.trim() || !form.label.trim() || !form.skuTitlesText.trim()) {
      setError('Key, label, and at least one SKU are required.')
      return
    }
    const body = {
      type: form.type,
      key: form.key.trim(),
      label: form.label.trim(),
      skuTitles: form.skuTitlesText.split('\n').map(s => s.trim()).filter(Boolean),
      blurb: form.blurb.trim() || undefined,
      features: form.featuresText.split('\n').map(s => s.trim()).filter(Boolean),
      order: Number(form.order) || 0,
    }
    const res = await fetch(editingId ? `/api/product-mappings/${editingId}` : '/api/product-mappings', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to save.')
      return
    }
    setShowForm(false)
    fetchAll()
  }

  async function remove(id: string) {
    await fetch(`/api/product-mappings/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const packages = mappings.filter(m => m.type === 'package')
  const addons = mappings.filter(m => m.type === 'addon')

  const Section = ({ title, items, type }: { title: string; items: Mapping[]; type: 'package' | 'addon' }) => (
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {isAdmin && (
          <button onClick={() => openCreate(type)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">
            + Add {type === 'package' ? 'package' : 'add-on'}
          </button>
        )}
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">None defined yet.</p>
        ) : items.map(m => (
          <div key={m._id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <p className="text-[11px] text-muted-foreground font-mono">key: {m.key}</p>
                {m.blurb && <p className="text-xs text-muted-foreground mt-1">{m.blurb}</p>}
              </div>
              {isAdmin && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(m)} className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary">Edit</button>
                  <button onClick={() => remove(m._id)} className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 ring-1 ring-red-200">Remove</button>
                </div>
              )}
            </div>
            <div className="mt-2.5 space-y-1.5">
              {m.skuTitles.map(sku => {
                const row = priceFor(sku)
                return (
                  <div key={sku} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-1.5 text-xs">
                    <span className="text-foreground">{sku}</span>
                    {row ? (
                      <span className="flex-shrink-0 font-medium text-foreground">
                        {fmtCurrency(row.retailUSD, 'USD')}/yr <span className="text-muted-foreground">({(row.marginPercent * 100).toFixed(1)}% margin)</span>
                      </span>
                    ) : (
                      <span className="flex-shrink-0 text-amber-600">No catalog match — check Pricing Catalog</span>
                    )}
                  </div>
                )
              })}
            </div>
            {m.features && m.features.length > 0 && (
              <details className="mt-2">
                <summary className="text-[11px] text-primary cursor-pointer">What's included ({m.features.length})</summary>
                <ul className="mt-1.5 list-disc pl-4 text-[11px] text-muted-foreground space-y-0.5">
                  {m.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground px-1">
        What "{packages[0]?.label || 'Starter Cloud Office'}" and other product names actually mean in Microsoft licensing terms —
        use this when provisioning a deal that's gone Won, or when a customer asks exactly what they're buying.
      </p>
      <Section title="Packages" items={packages} type="package" />
      <Section title="Add-ons" items={addons} type="addon" />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-foreground mb-3">{editingId ? 'Edit' : 'Add'} {form.type}</h2>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <input placeholder="key (e.g. starter)" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                  disabled={!!editingId} className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none disabled:opacity-50" />
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'package' | 'addon' }))}
                  className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none">
                  <option value="package">Package</option>
                  <option value="addon">Add-on</option>
                </select>
              </div>
              <input placeholder="Customer-facing label" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none" />
              <textarea placeholder="Catalog SKU title(s) — one per line, must match Pricing Catalog exactly" value={form.skuTitlesText}
                onChange={e => setForm(f => ({ ...f, skuTitlesText: e.target.value }))} rows={3}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs font-mono outline-none" />
              <input placeholder="Blurb (one line, mainly for add-ons)" value={form.blurb} onChange={e => setForm(f => ({ ...f, blurb: e.target.value }))}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none" />
              <textarea placeholder="Feature bullets — one per line (packages only)" value={form.featuresText}
                onChange={e => setForm(f => ({ ...f, featuresText: e.target.value }))} rows={4}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs outline-none" />
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/40">Cancel</button>
              <button onClick={save} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
