'use client'
import { useState, useEffect, useMemo } from 'react'
import { fmtCurrency } from '@/lib/currency'
import { deriveDeploymentTags, suggestScopeKeys, computeBrdRecommendation, computeSetupFeeLineItems, type SetupFeeCatalogItem } from '@/lib/deploymentRecommendation'

interface DiscoveryAssessment {
  _id: string
  isExistingM365Customer: boolean
  currentEmailProvider?: string
  employeeCount: string
  handlesSensitiveData: boolean
  painPoints: string[]
  budgetRange?: string
  dataScope?: string[]
  cutoverTolerance?: string
  recommendedPackageKey?: string
  recommendedAddOnKeys?: string[]
  createdAt: string
}

interface Checklist {
  _id?: string
  customerId?: string
  leadId?: string
  leadRef?: string
  company: string
  discoveryAssessmentId?: string
  migrationType: 'existing_m365' | 'other_platform' | 'net_new'
  sourcePlatform?: string
  existingTenantId?: string
  dnsAccessType?: string
  dnsContactName?: string
  dnsContactEmail?: string
  userCount: number
  userInventoryReceived: boolean
  dataScope: string[]
  cutoverTolerance?: string
  mfaApproach?: string
  scopeOfWork: string[]
  setupFeeLines: any[]
  setupFeeTotalUSD: number
  setupFeeOverrideUSD?: number
  brdRecommended: boolean
  brdReasons: string[]
  brdStatus: string
  goLiveDate?: string
  hypercareEndDate?: string
  assignedEngineerName?: string
  assignedEngineerEmail?: string
  status: string
  notes?: string
}

const DATA_SCOPE_OPTIONS = ['Email', 'Calendar', 'Contacts', 'Files / shared drives', 'Teams/Slack history', 'Third-party app integrations']

function emptyChecklist(customerId: string, leadId: string | undefined, leadRef: string | undefined, company: string, userCount: number): Checklist {
  return {
    customerId, leadId, leadRef, company,
    migrationType: 'net_new',
    userCount: userCount || 1,
    userInventoryReceived: false,
    dataScope: [],
    scopeOfWork: [],
    setupFeeLines: [],
    setupFeeTotalUSD: 0,
    brdRecommended: false,
    brdReasons: [],
    brdStatus: 'not_needed',
    status: 'planning',
  }
}

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

export default function DeploymentChecklistTool({ customerId, leadId, leadRef, company, userCountDefault, onClose, variant = 'modal', onSaved }: {
  customerId: string; leadId?: string; leadRef?: string; company: string; userCountDefault: number; onClose?: () => void
  // 'modal' (default) = existing popup behaviour, unchanged everywhere it's
  // already used (e.g. the Customer Accounts "Checklist" button).
  // 'inline' = renders just the form content with no backdrop/close button,
  // for embedding directly inside a page (e.g. the merged Onboarding page).
  variant?: 'modal' | 'inline'
  // Fired after a successful save, in addition to the usual in-place update —
  // lets an embedding page (e.g. switch to the Execution tab) react to a save
  // without needing to poll or duplicate the save logic itself.
  onSaved?: () => void
}) {
  const [catalog, setCatalog] = useState<SetupFeeCatalogItem[]>([])
  const [discovery, setDiscovery] = useState<DiscoveryAssessment | null>(null)
  const [checklist, setChecklist] = useState<Checklist>(emptyChecklist(customerId, leadId, leadRef, company, userCountDefault))
  const [existingId, setExistingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const catRes = await fetch('/api/setup-fee-catalog')
        const catData = await catRes.json()
        if (!cancelled && Array.isArray(catData)) setCatalog(catData)

        const existingRes = await fetch(`/api/deployment-checklists?customerId=${customerId}`)
        const existingData = await existingRes.json()
        if (!cancelled && existingData?.items?.length > 0) {
          const latest = existingData.items[0]
          setChecklist(latest)
          setExistingId(latest._id)
        } else if (leadId) {
          const discRes = await fetch(`/api/discovery-assessments?leadId=${leadId}`)
          const discData = await discRes.json()
          const latestDiscovery = discData?.items?.[0]
          if (!cancelled && latestDiscovery) {
            setDiscovery(latestDiscovery)
            const tags = deriveDeploymentTags(latestDiscovery)
            const suggested = suggestScopeKeys(tags, catData)
            setChecklist(prev => ({
              ...prev,
              migrationType: latestDiscovery.isExistingM365Customer ? 'existing_m365' : 'net_new',
              sourcePlatform: latestDiscovery.currentEmailProvider || undefined,
              discoveryAssessmentId: latestDiscovery._id,
              scopeOfWork: suggested,
              dataScope: latestDiscovery.dataScope?.length ? latestDiscovery.dataScope : prev.dataScope,
              cutoverTolerance: latestDiscovery.cutoverTolerance || prev.cutoverTolerance,
            }))
          }
        }
      } catch (e) { console.error(e) }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [customerId, leadId])

  const tags = useMemo(() => discovery ? deriveDeploymentTags(discovery) : [], [discovery])
  const { lines, totalUSD } = useMemo(() => computeSetupFeeLineItems(checklist.scopeOfWork, checklist.userCount, catalog), [checklist.scopeOfWork, checklist.userCount, catalog])
  const brd = useMemo(() => computeBrdRecommendation({ scopeKeys: checklist.scopeOfWork, catalog, tags }), [checklist.scopeOfWork, catalog, tags])

  const displayTotal = checklist.setupFeeOverrideUSD ?? totalUSD
  const categories = useMemo(() => {
    const groups: Record<string, SetupFeeCatalogItem[]> = {}
    for (const item of catalog) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  }, [catalog])

  function update<K extends keyof Checklist>(key: K, value: Checklist[K]) {
    setChecklist(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSavedMsg('')
    const payload = {
      ...checklist,
      setupFeeLines: lines,
      setupFeeTotalUSD: totalUSD,
      brdRecommended: brd.recommended,
      brdReasons: brd.reasons,
      brdStatus: checklist.brdStatus === 'not_needed' && brd.recommended ? 'recommended' : checklist.brdStatus,
    }
    try {
      const res = await fetch(existingId ? `/api/deployment-checklists/${existingId}` : '/api/deployment-checklists', {
        method: existingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed to save.'); setSaving(false); return }
      if (!existingId) setExistingId(data.item._id)
      setChecklist(data.item)
      setSavedMsg('Saved.')
      onSaved?.()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inp = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
  const label = "mb-1.5 block text-xs font-medium text-foreground"

  const bodyContent = (
    <>
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className={variant === 'inline' ? 'space-y-5' : 'max-h-[75vh] overflow-y-auto px-5 py-4 space-y-5'}>

            <div className="rounded-xl border border-border p-3.5 space-y-3">
              <p className="text-xs font-semibold text-foreground">Migration profile</p>
              <div className="flex gap-2">
                {(['net_new', 'existing_m365', 'other_platform'] as const).map(opt => (
                  <button key={opt} type="button" onClick={() => update('migrationType', opt)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${checklist.migrationType === opt ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:bg-secondary'}`}>
                    {opt === 'net_new' ? 'Net new' : opt === 'existing_m365' ? 'Existing M365' : 'Other platform'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={label}>Source platform / existing tenant notes</label>
                  <input value={checklist.sourcePlatform || ''} onChange={e => update('sourcePlatform', e.target.value)} className={inp} placeholder="e.g. Google Workspace, on-prem Exchange" />
                </div>
                <div>
                  <label className={label}>Existing tenant ID (if any)</label>
                  <input value={checklist.existingTenantId || ''} onChange={e => update('existingTenantId', e.target.value)} className={inp} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-3.5 space-y-3">
              <p className="text-xs font-semibold text-foreground">DNS & domain access</p>
              <select value={checklist.dnsAccessType || ''} onChange={e => update('dnsAccessType', e.target.value)} className={inp}>
                <option value="">Select...</option>
                <option value="credentials_provided">Customer gave us registrar/DNS access</option>
                <option value="customer_will_make_changes">Customer will make DNS changes themselves</option>
                <option value="not_yet_confirmed">Not yet confirmed</option>
              </select>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={label}>DNS contact name</label>
                  <input value={checklist.dnsContactName || ''} onChange={e => update('dnsContactName', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={label}>DNS contact email</label>
                  <input value={checklist.dnsContactEmail || ''} onChange={e => update('dnsContactEmail', e.target.value)} className={inp} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-3.5 space-y-3">
              <p className="text-xs font-semibold text-foreground">Users & data scope</p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={label}>User count (drives per-user fees)</label>
                  <input type="number" min={1} value={checklist.userCount} onChange={e => update('userCount', parseInt(e.target.value) || 1)} className={inp} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={checklist.userInventoryReceived} onChange={e => update('userInventoryReceived', e.target.checked)} />
                    Full user/mailbox inventory received
                  </label>
                </div>
              </div>
              <div>
                <label className={label}>What needs to move?</label>
                <div className="flex flex-wrap gap-1.5">
                  {DATA_SCOPE_OPTIONS.map(d => (
                    <button key={d} type="button" onClick={() => update('dataScope', toggle(checklist.dataScope, d))}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${checklist.dataScope.includes(d) ? 'bg-primary text-white ring-primary' : 'bg-white text-foreground ring-border hover:bg-secondary'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={label}>Cutover tolerance</label>
                  <select value={checklist.cutoverTolerance || ''} onChange={e => update('cutoverTolerance', e.target.value)} className={inp}>
                    <option value="">Select...</option>
                    <option value="zero_downtime">Zero downtime — parallel run required</option>
                    <option value="maintenance_window">OK with a maintenance window</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className={label}>MFA rollout approach</label>
                  <select value={checklist.mfaApproach || ''} onChange={e => update('mfaApproach', e.target.value)} className={inp}>
                    <option value="">Select...</option>
                    <option value="enforced_day_one">Enforced from day one</option>
                    <option value="grace_period">Grace period for adoption</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 space-y-3">
              <p className="text-xs font-semibold text-foreground">Scope of work {discovery && <span className="font-normal text-teal-700">— pre-ticked from Discovery Assessment, adjust freely</span>}</p>
              {Object.entries(categories).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{cat}</p>
                  <div className="space-y-1">
                    {items.map(item => (
                      <label key={item.key} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs cursor-pointer ring-1 ring-border">
                        <span className="flex items-center gap-2">
                          <input type="checkbox" checked={checklist.scopeOfWork.includes(item.key)} onChange={() => update('scopeOfWork', toggle(checklist.scopeOfWork, item.key))} />
                          {item.label}
                          {item.brdTrigger && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">BRD-relevant</span>}
                        </span>
                        <span className="flex-shrink-0 font-medium text-muted-foreground">
                          ${item.amountUSD}{item.unit === 'per_user' ? '/user' : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {brd.recommended && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3.5">
                <p className="text-xs font-semibold text-amber-800">📋 Business Requirement Document recommended</p>
                <ul className="mt-1.5 list-disc pl-4 text-[11px] text-amber-700 space-y-0.5">
                  {brd.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                <div className="mt-2">
                  <label className="text-[11px] font-medium text-amber-800 mr-2">Status:</label>
                  <select value={checklist.brdStatus} onChange={e => update('brdStatus', e.target.value)} className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px]">
                    <option value="recommended">Recommended — not yet discussed</option>
                    <option value="requested">Customer agreed — requested</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="not_needed">Decided not needed</option>
                  </select>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border p-3.5">
              <p className="text-xs font-semibold text-foreground mb-2">Setup fee — calculated from scope above</p>
              <div className="space-y-1">
                {lines.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No scope selected yet.</p>
                ) : lines.map(l => (
                  <div key={l.key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{l.label}{l.unit === 'per_user' ? ` × ${l.quantity} users` : ''}</span>
                    <span className="font-medium text-foreground">{fmtCurrency(l.lineTotalUSD, 'USD')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-base font-bold text-primary">{fmtCurrency(displayTotal, 'USD')}</span>
              </div>
              <div className="mt-2">
                <label className={label}>Override total (optional — e.g. negotiated discount)</label>
                <input type="number" value={checklist.setupFeeOverrideUSD ?? ''} onChange={e => update('setupFeeOverrideUSD', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder={`Computed: $${totalUSD}`} className={inp} />
              </div>
            </div>

            <div className="rounded-xl border border-border p-3.5 space-y-2.5">
              <p className="text-xs font-semibold text-foreground">Go-live & ownership</p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={label}>Go-live date</label>
                  <input type="date" value={checklist.goLiveDate?.slice(0, 10) || ''} onChange={e => update('goLiveDate', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={label}>Hypercare ends</label>
                  <input type="date" value={checklist.hypercareEndDate?.slice(0, 10) || ''} onChange={e => update('hypercareEndDate', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={label}>Assigned engineer (name)</label>
                  <input value={checklist.assignedEngineerName || ''} onChange={e => update('assignedEngineerName', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={label}>Assigned engineer (email)</label>
                  <input value={checklist.assignedEngineerEmail || ''} onChange={e => update('assignedEngineerEmail', e.target.value)} className={inp} />
                </div>
              </div>
              <div>
                <label className={label}>Status</label>
                <select value={checklist.status} onChange={e => update('status', e.target.value)} className={inp}>
                  <option value="planning">Planning</option>
                  <option value="in_progress">In progress</option>
                  <option value="live">Live</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className={label}>Notes</label>
                <textarea value={checklist.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} className={inp + ' resize-none'} />
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
            {savedMsg && <p className="text-xs text-green-600">{savedMsg}</p>}
          </div>
        )}
    </>
  )

  if (variant === 'inline') {
    return (
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Deployment Checklist — Planning</p>
          <h2 className="mt-0.5 text-base font-semibold text-foreground">{company}</h2>
          {discovery && (
            <p className="text-[11px] text-teal-700">📎 Pre-filled from Discovery Assessment ({new Date(discovery.createdAt).toLocaleDateString()})</p>
          )}
        </div>
        <div className="px-5 py-4">
          {bodyContent}
        </div>
        <div className="flex justify-end border-t border-border px-5 py-4">
          <button onClick={save} disabled={saving || loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : existingId ? 'Save Changes' : 'Create Checklist'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl my-auto">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Deployment Checklist</p>
            <h2 className="mt-0.5 text-base font-semibold text-foreground">{company}</h2>
            {discovery && (
              <p className="text-[11px] text-teal-700">📎 Pre-filled from Discovery Assessment ({new Date(discovery.createdAt).toLocaleDateString()})</p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">×</button>
        </div>
        {bodyContent}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">Close</button>
          <button onClick={save} disabled={saving || loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : existingId ? 'Save Changes' : 'Create Checklist'}
          </button>
        </div>
      </div>
    </div>
  )
}
