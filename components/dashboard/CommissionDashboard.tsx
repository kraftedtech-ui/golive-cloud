'use client'
import { useState, useEffect, useCallback } from 'react'
import CertificationBonusPanel from './CertificationBonusPanel'
import SkuMarginPicker from './SkuMarginPicker'
import { SUPPORTED_CURRENCIES, fmtCurrency, currencyForCountry } from '@/lib/currency'

interface CommissionRule { _id: string; type: 'do' | 'dont'; text: string; section: string }
interface Lead { _id: string; company: string; contact: string; status: string; country?: string; assignedTo?: string; assignedToEmail?: string; productCategory?: string; mrr?: number; setupFee?: number; grossProfitMargin?: number; commissionStatus?: string; currency?: string; createdAt: string }

const PRODUCT_CATEGORIES = [
  { value: 'm365_license', label: 'New M365 Licence / Subscription', probRate: 0.05, confirmedRate: 0.10 },
  { value: 'monthly_subscription', label: 'Monthly Subscription (ongoing)', probRate: 0.05, confirmedRate: 0.10, hasTrail: true },
  { value: 'annual_subscription', label: 'Annual Subscription (upfront)', probRate: 0.05, confirmedRate: 0.10 },
  { value: 'setup_migration', label: 'Setup / Migration / Onboarding', probRate: 0.10, confirmedRate: 0.125 },
  { value: 'support_retainer', label: 'Support Retainer (new)', probRate: 0.05, confirmedRate: 0.10 },
  { value: 'upsell_crosssell', label: 'Upsell / Cross-sell', probRate: 0.05, confirmedRate: 0.075 },
  { value: 'renewal', label: 'Renewal (actively managed)', probRate: 0, confirmedRate: 0.03 },
]

const STATUS_BADGE: Record<string, string> = {
  tracked: 'bg-blue-50 text-blue-700',
  accrued: 'bg-amber-50 text-amber-700',
  earned: 'bg-teal-50 text-teal-700',
  payable: 'bg-green-50 text-green-700',
  paid: 'bg-gray-100 text-gray-500',
}

function fmt(n: number) { return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
function toNGN(amount: number, currency: string | undefined, rates: Record<string, number>): number {
  return amount * (rates[currency || 'NGN'] ?? 1)
}

export default function CommissionDashboard({ userRole, userName, userEmail }: { userRole: string; userName: string; userEmail?: string }) {
  const [tab, setTab] = useState<'rules' | 'calculator' | 'tracker' | 'certification'>('rules')
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [fxRates, setFxRates] = useState<Record<string, number>>({ NGN: 1 })
  const [fxSource, setFxSource] = useState<'live' | 'manual'>('live')
  const [fxFetchedAt, setFxFetchedAt] = useState<string | null>(null)

  // Calculator state
  const [calcCategory, setCalcCategory] = useState('m365_license')
  const [calcDealValue, setCalcDealValue] = useState('')
  const [calcGPMargin, setCalcGPMargin] = useState('12')
  const [calcMarginSource, setCalcMarginSource] = useState<string | null>(null)
  const [calcPeriod, setCalcPeriod] = useState<'probation' | 'confirmed'>('probation')

  // Shared SKU-margin picker — 'calculator' or a lead._id, or null when closed
  const [pickerTarget, setPickerTarget] = useState<string | null>(null)

  // Admin rule management
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState({ type: 'do', text: '', section: 'General' })

  const isAdmin = userRole === 'admin'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesRes, leadsRes, fxRes] = await Promise.all([
        fetch('/api/commission-rules'),
        fetch('/api/leads'),
        fetch('/api/exchange-rates'),
      ])
      const rulesData = await rulesRes.json()
      const leadsData = await leadsRes.json()
      const fxData = await fxRes.json().catch(() => null)
      if (fxData?.success) {
        setFxRates(fxData.rates || { NGN: 1 })
        setFxSource(fxData.source || 'live')
        setFxFetchedAt(fxData.fetchedAt || null)
      }
      setRules(Array.isArray(rulesData) ? rulesData : [])
      // /api/leads responds with { success, leads: [...] }, not a bare array.
      const leadsArray: Lead[] = Array.isArray(leadsData)
        ? leadsData
        : Array.isArray(leadsData?.leads)
          ? leadsData.leads
          : []
      const myLeads = isAdmin
        ? leadsArray
        : leadsArray.filter((l: Lead) =>
            (!!userEmail && l.assignedToEmail === userEmail) || (!!userName && l.assignedTo === userName)
          )
      setLeads(Array.isArray(myLeads) ? myLeads : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [isAdmin, userName, userEmail])

  useEffect(() => { fetchData() }, [fetchData])

  // Calculator logic
  const dealValue = parseFloat(calcDealValue) || 0
  const gpMargin = parseFloat(calcGPMargin) / 100
  const gp = dealValue * gpMargin
  const cat = PRODUCT_CATEGORIES.find(c => c.value === calcCategory)!
  const rate = calcPeriod === 'probation' ? cat.probRate : cat.confirmedRate
  const commission = gp * rate
  const trailCommission = cat.hasTrail && calcPeriod === 'confirmed' ? gp * 0.03 : 0
  const month12Total = cat.hasTrail && calcPeriod === 'confirmed' ? commission + (trailCommission * 11) : 0
  const bonusTier = gp >= 1000000 ? { label: '₦1M GP Bonus', amount: 150000 } : gp >= 500000 ? { label: '₦500K GP Bonus', amount: 60000 } : gp >= 250000 ? { label: '₦250K GP Bonus', amount: 25000 } : null

  // Tracker stats
  const myTracked = leads.filter(l => l.commissionStatus === 'tracked' || !l.commissionStatus).length
  const myAccrued = leads.filter(l => l.commissionStatus === 'accrued').length
  const myEarned = leads.filter(l => l.commissionStatus === 'earned').length
  const myPayable = leads.filter(l => l.commissionStatus === 'payable').length

  const dos = rules.filter(r => r.type === 'do')
  const donts = rules.filter(r => r.type === 'dont')

  async function addRule() {
    if (!newRule.text.trim()) return
    await fetch('/api/commission-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRule) })
    setNewRule({ type: 'do', text: '', section: 'General' })
    setShowAddRule(false)
    fetchData()
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule?')) return
    await fetch(`/api/commission-rules/${id}`, { method: 'DELETE' })
    fetchData()
  }

  async function updateLeadDeal(id: string, patch: Record<string, unknown>) {
    setLeads(prev => prev.map(l => (l._id === id ? { ...l, ...patch } : l)))
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  function applyPickedMargin(marginPercent: number, summary: string) {
    if (pickerTarget === 'calculator') {
      setCalcGPMargin(String(marginPercent))
      setCalcMarginSource(summary)
    } else if (pickerTarget) {
      updateLeadDeal(pickerTarget, { grossProfitMargin: marginPercent })
    }
    setPickerTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Sales</p>
            <h2 className="mt-0.5 text-base font-semibold text-foreground">Commission Dashboard</h2>
            <p className="text-xs text-muted-foreground">Rules, forecast calculator & deal tracker</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['rules', 'calculator', 'tracker', 'certification'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'rules' ? '📋 Do\'s & Don\'ts' : t === 'calculator' ? '🧮 Forecast Calculator' : t === 'tracker' ? '📊 Commission Tracker' : '🎓 Certification Bonus'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* RULES TAB */}
          {tab === 'rules' && (
            <div className="space-y-5">
              {isAdmin && (
                <div className="flex justify-end">
                  <button onClick={() => setShowAddRule(!showAddRule)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                    + Add Rule
                  </button>
                </div>
              )}
              {showAddRule && isAdmin && (
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newRule.type} onChange={e => setNewRule(p => ({ ...p, type: e.target.value as 'do' | 'dont' }))}
                      className="rounded-lg border border-border px-3 py-2 text-sm bg-white">
                      <option value="do">✅ Do</option>
                      <option value="dont">🚫 Don't</option>
                    </select>
                    <input value={newRule.section} onChange={e => setNewRule(p => ({ ...p, section: e.target.value }))}
                      placeholder="Section (e.g. Pre-Sale)" className="rounded-lg border border-border px-3 py-2 text-sm" />
                  </div>
                  <textarea value={newRule.text} onChange={e => setNewRule(p => ({ ...p, text: e.target.value }))}
                    placeholder="Rule text..." rows={2}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none" />
                  <div className="flex gap-2">
                    <button onClick={addRule} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Save Rule</button>
                    <button onClick={() => setShowAddRule(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* DOs */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">✅</span>
                    <h3 className="text-sm font-semibold text-foreground">Always Do</h3>
                  </div>
                  <div className="space-y-2">
                    {dos.map(rule => (
                      <div key={rule._id} className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2.5">
                        <span className="text-green-600 mt-0.5 flex-shrink-0 text-xs font-bold">DO</span>
                        <p className="text-xs text-green-900 flex-1 leading-relaxed">{rule.text}</p>
                        {isAdmin && (
                          <button onClick={() => deleteRule(rule._id)} className="text-green-400 hover:text-red-500 flex-shrink-0 text-xs">✕</button>
                        )}
                      </div>
                    ))}
                    {dos.length === 0 && <p className="text-xs text-muted-foreground italic">No rules yet.</p>}
                  </div>
                </div>

                {/* DON'Ts */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🚫</span>
                    <h3 className="text-sm font-semibold text-foreground">Never Do</h3>
                  </div>
                  <div className="space-y-2">
                    {donts.map(rule => (
                      <div key={rule._id} className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                        <span className="text-red-500 mt-0.5 flex-shrink-0 text-xs font-bold">NO</span>
                        <p className="text-xs text-red-900 flex-1 leading-relaxed">{rule.text}</p>
                        {isAdmin && (
                          <button onClick={() => deleteRule(rule._id)} className="text-red-300 hover:text-red-600 flex-shrink-0 text-xs">✕</button>
                        )}
                      </div>
                    ))}
                    {donts.length === 0 && <p className="text-xs text-muted-foreground italic">No rules yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CALCULATOR TAB */}
          {tab === 'calculator' && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Product Category</label>
                    <select value={calcCategory} onChange={e => setCalcCategory(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white">
                      {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Deal Value (₦) — Customer invoice amount</label>
                    <input type="number" value={calcDealValue} onChange={e => setCalcDealValue(e.target.value)}
                      placeholder="e.g. 500000" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-muted-foreground">Gross Profit Margin % (your estimate)</label>
                      <button
                        type="button"
                        onClick={() => setPickerTarget('calculator')}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        🧮 Build from catalog
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="range" min="5" max="40" value={calcGPMargin} onChange={e => { setCalcGPMargin(e.target.value); setCalcMarginSource(null) }} className="flex-1" />
                      <span className="text-sm font-semibold text-primary w-10 text-right">{calcGPMargin}%</span>
                    </div>
                    {calcMarginSource ? (
                      <p className="text-[10px] text-teal-700 mt-1 truncate">📎 From catalog: {calcMarginSource}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">M365 licences typically 8–15%. Services 25–40%. Use "Build from catalog" for the real figure.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Your employment status</label>
                    <div className="flex gap-2">
                      {(['probation', 'confirmed'] as const).map(p => (
                        <button key={p} onClick={() => setCalcPeriod(p)}
                          className={`flex-1 rounded-lg border py-2 text-xs font-medium capitalize transition-colors ${calcPeriod === p ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:bg-secondary'}`}>
                          {p === 'probation' ? '🔄 Probation (Days 1–90)' : '✅ Confirmed (Day 91+)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results panel */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Forecast Breakdown</h4>
                  {dealValue > 0 ? (
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deal value</span>
                          <span className="font-medium">{fmt(dealValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. Gross Profit ({calcGPMargin}%)</span>
                          <span className="font-medium">{fmt(gp)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commission rate</span>
                          <span className="font-medium">{(rate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="border-t border-primary/20 pt-2 flex justify-between">
                          <span className="font-semibold text-foreground">Your commission</span>
                          <span className="font-bold text-primary text-base">{fmt(commission)}</span>
                        </div>
                        {cat.hasTrail && calcPeriod === 'confirmed' && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Trail (months 2–12, 3%)</span>
                              <span>{fmt(trailCommission)}/mo</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-muted-foreground">12-month total</span>
                              <span className="text-teal-700">{fmt(month12Total)}</span>
                            </div>
                          </>
                        )}
                        {cat.value === 'renewal' && calcPeriod === 'probation' && (
                          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                            Renewal commissions during probation require MD written approval before close.
                          </p>
                        )}
                      </div>

                      {bonusTier && (
                        <div className="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2.5">
                          <p className="text-xs font-semibold text-teal-800">+ {bonusTier.label}</p>
                          <p className="text-sm font-bold text-teal-700">{fmt(bonusTier.amount)}</p>
                          <p className="text-[10px] text-teal-600 mt-0.5">If this GP is generated in a single month</p>
                        </div>
                      )}

                      <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-[10px] text-amber-800 leading-relaxed">
                        This is a forecast only. Actual commission is subject to all earning conditions in the Commission Addendum REF#01010.
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Enter a deal value to see your forecast.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TRACKER TAB */}
          {tab === 'tracker' && (
            <div className="space-y-4">
              {/* Status summary */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Tracked', count: myTracked, color: 'text-blue-700 bg-blue-50 border-blue-100' },
                  { label: 'Accrued', count: myAccrued, color: 'text-amber-700 bg-amber-50 border-amber-100' },
                  { label: 'Earned', count: myEarned, color: 'text-teal-700 bg-teal-50 border-teal-100' },
                  { label: 'Payable', count: myPayable, color: 'text-green-700 bg-green-50 border-green-100' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border px-3 py-3 text-center ${s.color}`}>
                    <p className="text-xl font-bold">{s.count}</p>
                    <p className="text-xs font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {fxFetchedAt && (
                <p className="text-[11px] text-muted-foreground">
                  Live FX rates ({fxSource === 'live' ? 'auto-updated' : 'manually set'}, as of {new Date(fxFetchedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}):{' '}
                  {SUPPORTED_CURRENCIES.filter(c => c !== 'NGN').map(c => `1 ${c} = ${fmt(fxRates[c] || 0)}`).join('  ·  ')}
                </p>
              )}

              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-6">Loading deals...</p>
              ) : leads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No deals assigned to you yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        {['Company', 'Category', 'MRR', 'Est. GP', 'Est. Commission', 'Commission Status', 'Deal Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.filter(l => l.assignedTo || isAdmin).map(lead => {
                        const cat = PRODUCT_CATEGORIES.find(c => c.value === lead.productCategory)
                        const dealCurrency = lead.currency || currencyForCountry(lead.country)
                        const mrrNGN = lead.mrr ? toNGN(lead.mrr, dealCurrency, fxRates) : 0
                        const gp = mrrNGN ? mrrNGN * ((lead.grossProfitMargin || 12) / 100) : 0
                        const estCommission = gp * (cat?.confirmedRate || 0.10)
                        const canEdit = isAdmin || (!!userEmail && lead.assignedToEmail === userEmail)
                        return (
                          <tr key={lead._id} className="border-b border-border/50 hover:bg-secondary/20">
                            <td className="px-4 py-3 font-medium text-foreground">{lead.company}</td>
                            <td className="px-4 py-3 text-xs">
                              {canEdit ? (
                                <select
                                  value={lead.productCategory || ''}
                                  onChange={e => updateLeadDeal(lead._id, { productCategory: e.target.value || undefined })}
                                  className="rounded-md border border-border bg-white px-1.5 py-1 text-[11px]"
                                >
                                  <option value="">— Select —</option>
                                  {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                              ) : (cat?.label || '—')}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {canEdit ? (
                                <div className="flex items-center gap-1">
                                  <select
                                    value={dealCurrency}
                                    onChange={e => updateLeadDeal(lead._id, { currency: e.target.value })}
                                    className="rounded-md border border-border bg-white px-1 py-1 text-[11px]"
                                  >
                                    {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  <input
                                    type="number"
                                    value={lead.mrr ?? ''}
                                    placeholder="/mo"
                                    onChange={e => updateLeadDeal(lead._id, { mrr: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    className="w-16 rounded-md border border-border bg-white px-1.5 py-1 text-[11px]"
                                  />
                                </div>
                              ) : (lead.mrr ? fmtCurrency(lead.mrr, dealCurrency) : '—')}
                              {!!lead.mrr && dealCurrency !== 'NGN' && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">≈ {fmt(mrrNGN)}/mo</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {canEdit ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={lead.grossProfitMargin ?? ''}
                                    placeholder="12"
                                    onChange={e => updateLeadDeal(lead._id, { grossProfitMargin: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    className="w-12 rounded-md border border-border bg-white px-1.5 py-1 text-[11px]"
                                  />
                                  <span className="text-muted-foreground">%</span>
                                  <button
                                    type="button"
                                    onClick={() => setPickerTarget(lead._id)}
                                    title="Build margin from pricing catalog"
                                    className="text-[11px] text-primary hover:underline flex-shrink-0"
                                  >
                                    🧮
                                  </button>
                                  <span className="text-muted-foreground">→ {gp ? fmt(gp) : '—'}</span>
                                </div>
                              ) : (gp ? fmt(gp) : '—')}
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-primary">{estCommission ? fmt(estCommission) : '—'}</td>
                            <td className="px-4 py-3">
                              {canEdit ? (
                                <select
                                  value={lead.commissionStatus || 'tracked'}
                                  onChange={e => updateLeadDeal(lead._id, { commissionStatus: e.target.value })}
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize border-0 ${STATUS_BADGE[lead.commissionStatus || 'tracked'] || STATUS_BADGE.tracked}`}
                                >
                                  {['tracked', 'accrued', 'earned', 'payable', 'paid'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              ) : (
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_BADGE[lead.commissionStatus || 'tracked'] || STATUS_BADGE.tracked}`}>
                                  {lead.commissionStatus || 'tracked'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium capitalize">{lead.status}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CERTIFICATION TAB */}
          {tab === 'certification' && (
            <CertificationBonusPanel userRole={userRole} userName={userName} />
          )}
        </div>
      </div>

      <SkuMarginPicker
        open={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        onApply={applyPickedMargin}
      />
    </div>
  )
}
