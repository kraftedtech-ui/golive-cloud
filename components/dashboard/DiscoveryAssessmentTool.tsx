'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { DISCOVERY_PAIN_POINTS, computeRecommendation } from '@/lib/discoveryRecommendation'

interface Lead { _id: string; ref: string; company: string; country: string; status: string; assignedToEmail?: string }
interface ProductMappingItem { type: 'package' | 'addon'; key: string; label: string; blurb?: string; active?: boolean }

interface Assessment {
  _id: string
  leadId: string
  leadRef: string
  company: string
  completedByName?: string
  isExistingM365Customer: boolean
  currentPlan?: string
  employeeCount: string
  painPoints: string[]
  recommendedPackageKey?: string
  recommendedAddOnKeys?: string[]
  needsOfflineConsult: boolean
  consultReasons?: string[]
  createdAt: string
}

const EMPLOYEE_BANDS = ['1–5', '6–20', '21–50', '51–200', '200+']
const DEVICE_TYPES = ['Windows laptops/desktops', 'Mac', 'Mobile (iOS/Android)', 'Shared/kiosk devices']
const SENSITIVE_DATA_TYPES = ['Financial / payment data', 'Health records', 'Legal / contracts', 'Personal customer data']
const SWITCH_REASONS = ['Cost', 'Poor support from current provider', 'Billing not in local currency', 'Want bundled security/services', 'Other']
const BUDGET_RANGES = ['Not yet defined', 'Under $500/mo', '$500–2,000/mo', '$2,000–10,000/mo', '$10,000+/mo']
const TIMELINES = ['Immediate (this month)', 'Next 1–3 months', 'Next 3–6 months', 'Just exploring']

const emptyForm = {
  isExistingM365Customer: false,
  currentPlan: '', currentLicenseCount: '', currentCSPManager: '', contractRenewalDate: '', switchReasons: [] as string[],
  currentEmailProvider: '', currentProviderChallenges: '',
  employeeCount: '1–5', deviceTypes: [] as string[], remoteHybridWork: false,
  itSupportModel: 'none', handlesSensitiveData: false, sensitiveDataTypes: [] as string[],
  painPoints: [] as string[], otherPainPointNotes: '',
  budgetRange: '', decisionTimeline: '', additionalNotes: '',
}

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

export default function DiscoveryAssessmentTool({ leads, isAdmin, userEmail }: { leads: Lead[]; isAdmin: boolean; userEmail: string }) {
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [mappings, setMappings] = useState<ProductMappingItem[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState<Assessment | null>(null)

  useEffect(() => {
    fetch('/api/product-mappings').then(r => r.json()).then(items => { if (Array.isArray(items)) setMappings(items) }).catch(() => {})
  }, [])

  const fetchAssessments = useCallback(() => {
    setLoadingAssessments(true)
    fetch('/api/discovery-assessments').then(r => r.json())
      .then(data => setAssessments(Array.isArray(data?.items) ? data.items : []))
      .catch(() => {})
      .finally(() => setLoadingAssessments(false))
  }, [])
  useEffect(() => { fetchAssessments() }, [fetchAssessments])

  const packages = mappings.filter(m => m.type === 'package' && m.active !== false)
  const addOnDefs = mappings.filter(m => m.type === 'addon' && m.active !== false)

  const recommendation = useMemo(() => computeRecommendation({
    painPoints: form.painPoints,
    handlesSensitiveData: form.handlesSensitiveData,
    validPackageKeys: packages.map(p => p.key),
    validAddOnKeys: addOnDefs.map(a => a.key),
  }), [form.painPoints, form.handlesSensitiveData, packages, addOnDefs])

  const recommendedPackage = packages.find(p => p.key === recommendation.packageKey)
  const recommendedAddOns = addOnDefs.filter(a => recommendation.addOnKeys.includes(a.key))

  const selectableLeads = leads.filter(l => isAdmin || l.assignedToEmail === userEmail)
  const selectedLead = leads.find(l => l._id === selectedLeadId)
  const leadAssessments = selectedLeadId ? assessments.filter(a => a.leadId === selectedLeadId) : []

  function resetForm() { setForm(emptyForm) }

  async function save() {
    if (!selectedLeadId || !selectedLead) { setError('Select a lead first.'); return }
    setSaving(true)
    setError('')
    setSavedMsg('')
    try {
      const res = await fetch('/api/discovery-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead._id,
          leadRef: selectedLead.ref,
          company: selectedLead.company,
          ...form,
          currentLicenseCount: form.currentLicenseCount ? parseInt(form.currentLicenseCount) : undefined,
          contractRenewalDate: form.contractRenewalDate || undefined,
          recommendedPackageKey: recommendation.packageKey,
          recommendedAddOnKeys: recommendation.addOnKeys,
          needsOfflineConsult: recommendation.needsOfflineConsult,
          consultReasons: recommendation.consultReasons,
        }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed to save.'); setSaving(false); return }
      setSavedMsg('Assessment saved.')
      resetForm()
      fetchAssessments()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inp = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
  const label = "mb-1.5 block text-xs font-medium text-foreground"

  return (
    <div className="grid grid-cols-1 gap-6 p-5 xl:grid-cols-[1fr_380px]">
      {/* FORM */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-white shadow-sm p-5 space-y-4">
          <div>
            <label className={label}>Lead</label>
            <select value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} className={inp}>
              <option value="">Select a lead...</option>
              {selectableLeads.map(l => <option key={l._id} value={l._id}>{l.company} — {l.country} ({l.status})</option>)}
            </select>
            {selectableLeads.length === 0 && (
              <p className="mt-1.5 text-[11px] text-amber-600">No assigned leads yet — ask your admin to assign you one first.</p>
            )}
          </div>

          {selectedLeadId && (
            <>
              {leadAssessments.length > 0 && (
                <div className="rounded-lg bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">
                  {leadAssessments.length} previous assessment{leadAssessments.length > 1 ? 's' : ''} on file for this lead — see the list on the right. Submitting below adds a new one (doesn't overwrite).
                </div>
              )}

              <div className="rounded-xl border border-border bg-secondary/20 p-3">
                <p className="mb-2 text-xs font-semibold text-foreground">Are they already using Microsoft 365?</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, isExistingM365Customer: true }))}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${form.isExistingM365Customer ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:bg-secondary'}`}>
                    Yes — already on M365
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isExistingM365Customer: false }))}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${!form.isExistingM365Customer ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:bg-secondary'}`}>
                    No — not yet / different provider
                  </button>
                </div>

                {form.isExistingM365Customer ? (
                  <div className="mt-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className={label}>Current plan</label>
                        <input value={form.currentPlan} onChange={e => setForm(f => ({ ...f, currentPlan: e.target.value }))} placeholder="e.g. Business Standard" className={inp} />
                      </div>
                      <div>
                        <label className={label}>Licensed users</label>
                        <input type="number" value={form.currentLicenseCount} onChange={e => setForm(f => ({ ...f, currentLicenseCount: e.target.value }))} className={inp} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className={label}>Who manages it today?</label>
                        <select value={form.currentCSPManager} onChange={e => setForm(f => ({ ...f, currentCSPManager: e.target.value }))} className={inp}>
                          <option value="">Select...</option>
                          <option value="self_managed">Self-managed in-house</option>
                          <option value="another_csp">Another CSP/reseller</option>
                          <option value="microsoft_direct">Direct with Microsoft</option>
                          <option value="not_sure">Not sure</option>
                        </select>
                      </div>
                      <div>
                        <label className={label}>Contract renewal date</label>
                        <input type="date" value={form.contractRenewalDate} onChange={e => setForm(f => ({ ...f, contractRenewalDate: e.target.value }))} className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className={label}>Why consider switching to GoLive? (select all that apply)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {SWITCH_REASONS.map(r => (
                          <button key={r} type="button" onClick={() => setForm(f => ({ ...f, switchReasons: toggle(f.switchReasons, r) }))}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${form.switchReasons.includes(r) ? 'bg-primary text-white ring-primary' : 'bg-white text-foreground ring-border hover:bg-secondary'}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <label className={label}>Current email/productivity provider</label>
                      <input value={form.currentEmailProvider} onChange={e => setForm(f => ({ ...f, currentEmailProvider: e.target.value }))} placeholder="e.g. Google Workspace, cPanel/webmail, Zoho" className={inp} />
                    </div>
                    <div>
                      <label className={label}>What's frustrating about their current setup?</label>
                      <textarea value={form.currentProviderChallenges} onChange={e => setForm(f => ({ ...f, currentProviderChallenges: e.target.value }))} rows={2} className={inp + ' resize-none'} />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border p-3 space-y-2.5">
                <p className="text-xs font-semibold text-foreground">Business & technical profile</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={label}>Employee count</label>
                    <select value={form.employeeCount} onChange={e => setForm(f => ({ ...f, employeeCount: e.target.value }))} className={inp}>
                      {EMPLOYEE_BANDS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>IT support model</label>
                    <select value={form.itSupportModel} onChange={e => setForm(f => ({ ...f, itSupportModel: e.target.value }))} className={inp}>
                      <option value="none">No dedicated IT</option>
                      <option value="in_house">In-house IT</option>
                      <option value="outsourced">Outsourced IT</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={label}>Device types in use</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DEVICE_TYPES.map(d => (
                      <button key={d} type="button" onClick={() => setForm(f => ({ ...f, deviceTypes: toggle(f.deviceTypes, d) }))}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${form.deviceTypes.includes(d) ? 'bg-primary text-white ring-primary' : 'bg-white text-foreground ring-border hover:bg-secondary'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.remoteHybridWork} onChange={e => setForm(f => ({ ...f, remoteHybridWork: e.target.checked }))} />
                  Team works remote or hybrid (not all in one office)
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.handlesSensitiveData} onChange={e => setForm(f => ({ ...f, handlesSensitiveData: e.target.checked }))} />
                  Business handles sensitive data (financial, health, legal, personal customer data)
                </label>
                {form.handlesSensitiveData && (
                  <div className="pl-5">
                    <label className={label}>Which kinds?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SENSITIVE_DATA_TYPES.map(d => (
                        <button key={d} type="button" onClick={() => setForm(f => ({ ...f, sensitiveDataTypes: toggle(f.sensitiveDataTypes, d) }))}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${form.sensitiveDataTypes.includes(d) ? 'bg-amber-500 text-white ring-amber-500' : 'bg-white text-foreground ring-border hover:bg-secondary'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">What's actually causing them pain right now?</p>
                <p className="text-[11px] text-muted-foreground -mt-1">Select everything that applies — this drives the recommendation on the right.</p>
                <div className="space-y-1.5">
                  {DISCOVERY_PAIN_POINTS.map(p => (
                    <label key={p.key} className="flex items-start gap-2 text-xs cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={form.painPoints.includes(p.key)} onChange={() => setForm(f => ({ ...f, painPoints: toggle(f.painPoints, p.key) }))} />
                      <span className="flex-1">{p.label}</span>
                      {p.alwaysConsult && <span className="flex-shrink-0 text-[10px] text-amber-600 font-medium">needs consult</span>}
                    </label>
                  ))}
                </div>
                {form.painPoints.includes('other') && (
                  <textarea value={form.otherPainPointNotes} onChange={e => setForm(f => ({ ...f, otherPainPointNotes: e.target.value }))}
                    placeholder="Describe the 'something else' pain point..." rows={2} className={inp + ' resize-none mt-1'} />
                )}
              </div>

              <div className="rounded-xl border border-border p-3 space-y-2.5">
                <p className="text-xs font-semibold text-foreground">Budget & timeline</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={label}>Budget range</label>
                    <select value={form.budgetRange} onChange={e => setForm(f => ({ ...f, budgetRange: e.target.value }))} className={inp}>
                      <option value="">Select...</option>
                      {BUDGET_RANGES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Decision timeline</label>
                    <select value={form.decisionTimeline} onChange={e => setForm(f => ({ ...f, decisionTimeline: e.target.value }))} className={inp}>
                      <option value="">Select...</option>
                      {TIMELINES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={label}>Additional notes</label>
                  <textarea value={form.additionalNotes} onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))} rows={2} className={inp + ' resize-none'} />
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
              {savedMsg && <p className="text-xs text-green-600">{savedMsg}</p>}

              <button onClick={save} disabled={saving}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Assessment'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* RECOMMENDATION + HISTORY */}
      <div className="space-y-4">
        {selectedLeadId && (
          <div className="rounded-2xl border border-border bg-white shadow-sm p-5 sticky top-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary mb-2">Live Recommendation</p>
            {packages.length === 0 ? (
              <p className="text-xs text-muted-foreground">Loading product catalog…</p>
            ) : (
              <>
                <p className="text-sm font-bold text-foreground">{recommendedPackage?.label || 'Starter Cloud Office'}</p>
                {recommendedAddOns.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">+ Recommended add-ons:</p>
                    {recommendedAddOns.map(a => (
                      <p key={a.key} className="text-xs text-foreground">• {a.label}</p>
                    ))}
                  </div>
                )}
                {recommendation.needsOfflineConsult && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-amber-800">⚠ Needs an offline consult</p>
                    <ul className="mt-1 list-disc pl-4 text-[11px] text-amber-700 space-y-0.5">
                      {recommendation.consultReasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                <p className="mt-3 text-[10px] text-muted-foreground">Updates live as you answer. Once saved, use this package/add-on combination in the Proposal Generator for {selectedLead?.company}.</p>
              </>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Saved Assessments</h2>
            <p className="text-[11px] text-muted-foreground">{selectedLeadId ? `For ${selectedLead?.company}` : 'All leads'}</p>
          </div>
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {loadingAssessments ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">Loading…</p>
            ) : (selectedLeadId ? leadAssessments : assessments).length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No assessments yet.</p>
            ) : (selectedLeadId ? leadAssessments : assessments).map(a => (
              <button key={a._id} onClick={() => setViewing(a)} className="block w-full px-4 py-3 text-left hover:bg-secondary/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{a.company}</p>
                  <span className="text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {a.isExistingM365Customer ? 'Existing M365' : 'Net new'} · {a.employeeCount} · {a.painPoints.length} pain point{a.painPoints.length !== 1 ? 's' : ''}
                  {a.needsOfflineConsult && <span className="text-amber-600"> · needs consult</span>}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-auto">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{viewing.company}</h2>
                <p className="text-xs text-muted-foreground">{viewing.leadRef} · {new Date(viewing.createdAt).toLocaleString()} · by {viewing.completedByName || 'unknown'}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-muted-foreground hover:text-foreground text-lg">×</button>
            </div>
            <div className="px-5 py-4 space-y-3 text-xs">
              <p><span className="text-muted-foreground">M365 status:</span> <strong>{viewing.isExistingM365Customer ? `Existing customer${viewing.currentPlan ? ' — ' + viewing.currentPlan : ''}` : 'Net new'}</strong></p>
              <p><span className="text-muted-foreground">Employee count:</span> <strong>{viewing.employeeCount}</strong></p>
              <div>
                <p className="text-muted-foreground mb-1">Pain points:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {viewing.painPoints.map(key => <li key={key}>{DISCOVERY_PAIN_POINTS.find(p => p.key === key)?.label || key}</li>)}
                </ul>
              </div>
              <p><span className="text-muted-foreground">Recommended package:</span> <strong>{packages.find(p => p.key === viewing.recommendedPackageKey)?.label || viewing.recommendedPackageKey}</strong></p>
              {(viewing.recommendedAddOnKeys || []).length > 0 && (
                <p><span className="text-muted-foreground">Recommended add-ons:</span> {viewing.recommendedAddOnKeys!.map(k => addOnDefs.find(a => a.key === k)?.label || k).join(', ')}</p>
              )}
              {viewing.needsOfflineConsult && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <p className="font-semibold text-amber-800">Needs offline consult:</p>
                  <ul className="list-disc pl-4 text-amber-700">
                    {(viewing.consultReasons || []).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-border px-5 py-4">
              <button onClick={() => setViewing(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
