'use client'
import { useState, useEffect, useCallback } from 'react'

interface FeeItem {
  _id: string
  key: string
  label: string
  category: string
  unit: 'flat' | 'per_user'
  amountUSD: number
  autoSuggestTags: string[]
  brdTrigger: boolean
}

const emptyForm = { key: '', label: '', category: 'General', unit: 'flat' as 'flat' | 'per_user', amountUSD: 0, autoSuggestTagsText: '', brdTrigger: false }

export default function SetupFeeCatalogAdmin({ isAdmin }: { isAdmin: boolean }) {
  const [items, setItems] = useState<FeeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/setup-fee-catalog')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchItems() }, [fetchItems])

  function openCreate() { setForm(emptyForm); setEditingId(null); setShowForm(true); setError('') }
  function openEdit(item: FeeItem) {
    setForm({ key: item.key, label: item.label, category: item.category, unit: item.unit, amountUSD: item.amountUSD, autoSuggestTagsText: item.autoSuggestTags.join(', '), brdTrigger: item.brdTrigger })
    setEditingId(item._id); setShowForm(true); setError('')
  }

  async function save() {
    if (!form.key.trim() || !form.label.trim() || !form.amountUSD) { setError('Key, label, and amount are required.'); return }
    const body = {
      key: form.key.trim(), label: form.label.trim(), category: form.category.trim() || 'General',
      unit: form.unit, amountUSD: Number(form.amountUSD),
      autoSuggestTags: form.autoSuggestTagsText.split(',').map(s => s.trim()).filter(Boolean),
      brdTrigger: form.brdTrigger,
    }
    const res = await fetch(editingId ? `/api/setup-fee-catalog/${editingId}` : '/api/setup-fee-catalog', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Failed to save.'); return }
    setShowForm(false)
    fetchItems()
  }

  async function remove(id: string) {
    await fetch(`/api/setup-fee-catalog/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  const byCategory = items.reduce((acc, item) => {
    (acc[item.category] ||= []).push(item)
    return acc
  }, {} as Record<string, FeeItem[]>)

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Admin</p>
          <h2 className="mt-0.5 text-base font-semibold text-foreground">Setup Fee Catalog</h2>
          <p className="text-xs text-muted-foreground">Drives the Deployment Checklist's scope-of-work pricing and auto-suggestions. Edit a figure here and it updates everywhere immediately.</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">+ Add fee item</button>
        )}
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : Object.entries(byCategory).map(([cat, catItems]) => (
          <div key={cat} className="px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{cat}</p>
            <div className="space-y-1.5">
              {catItems.map(item => (
                <div key={item._id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                  <div>
                    <span className="font-medium text-foreground">{item.label}</span>
                    {item.brdTrigger && <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">BRD-relevant</span>}
                    <div className="text-[10px] text-muted-foreground font-mono">key: {item.key} · tags: {item.autoSuggestTags.join(', ') || 'none'}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold text-foreground">${item.amountUSD}{item.unit === 'per_user' ? '/user' : ''}</span>
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(item)} className="rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-secondary">Edit</button>
                        <button onClick={() => remove(item._id)} className="rounded-lg bg-red-50 px-2 py-1 text-[11px] text-red-600 hover:bg-red-100">Remove</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-foreground mb-3">{editingId ? 'Edit' : 'Add'} fee item</h2>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <input placeholder="key (e.g. tenant_setup)" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                  disabled={!!editingId} className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none disabled:opacity-50" />
                <input placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none" />
              </div>
              <input placeholder="Label" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none" />
              <div className="grid grid-cols-2 gap-2.5">
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value as 'flat' | 'per_user' }))}
                  className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none">
                  <option value="flat">Flat fee</option>
                  <option value="per_user">Per user</option>
                </select>
                <input type="number" placeholder="Amount (USD)" value={form.amountUSD} onChange={e => setForm(f => ({ ...f, amountUSD: Number(e.target.value) }))}
                  className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none" />
              </div>
              <input placeholder="Auto-suggest tags, comma separated (e.g. existing_m365, email_security)" value={form.autoSuggestTagsText}
                onChange={e => setForm(f => ({ ...f, autoSuggestTagsText: e.target.value }))}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs font-mono outline-none" />
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={form.brdTrigger} onChange={e => setForm(f => ({ ...f, brdTrigger: e.target.checked }))} />
                Selecting this item should flag a BRD recommendation
              </label>
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
