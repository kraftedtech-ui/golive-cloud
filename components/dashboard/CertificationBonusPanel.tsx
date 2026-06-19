'use client'
import { useState, useEffect, useCallback } from 'react'

interface CatalogItem { _id: string; name: string; vendor: string; level: 'foundational' | 'intermediate' | 'advanced'; bonusAmount: number; active: boolean }
interface CertRecord {
  _id: string
  employeeName: string
  employeeEmail?: string
  certName: string
  vendor: string
  level: 'foundational' | 'intermediate' | 'advanced'
  bonusAmount: number
  examFee?: number
  credentialId?: string
  proofUrl?: string
  status: string
  adminNotes?: string
  requestedAt: string
  approvedAt?: string
  submittedAt?: string
  verifiedAt?: string
  paidAt?: string
}

const LEVEL_LABEL: Record<string, string> = { foundational: 'Foundational', intermediate: 'Intermediate / Role-Based', advanced: 'Advanced / Specialist' }
const LEVEL_RANGE: Record<string, string> = { foundational: '₦25,000', intermediate: '₦50,000', advanced: '₦75,000–₦100,000 (MD confirms exact amount)' }
const LEVEL_DEFAULT: Record<string, number> = { foundational: 25000, intermediate: 50000, advanced: 0 }
const FIRST_YEAR_CAP = 100000

const STATUS_FLOW = ['requested', 'approved_to_enroll', 'submitted', 'verified', 'earned', 'payable', 'paid']
const STATUS_LABEL: Record<string, string> = {
  requested: 'Requested', approved_to_enroll: 'Approved to Enroll', denied: 'Denied',
  submitted: 'Submitted for Verification', verified: 'Verified', earned: 'Earned',
  payable: 'Payable', paid: 'Paid',
}
const STATUS_BADGE: Record<string, string> = {
  requested: 'bg-blue-50 text-blue-700', approved_to_enroll: 'bg-indigo-50 text-indigo-700', denied: 'bg-red-50 text-red-700',
  submitted: 'bg-amber-50 text-amber-700', verified: 'bg-purple-50 text-purple-700', earned: 'bg-teal-50 text-teal-700',
  payable: 'bg-green-50 text-green-700', paid: 'bg-gray-100 text-gray-500',
}

function fmt(n: number) { return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

const ELIGIBILITY_CONDITIONS = [
  'Approved in writing by the Company before registration or enrollment',
  'Examination passed / certification requirements completed',
  'Verifiable proof submitted (credential ID or verification link)',
  'Certification is current, authentic, and relevant to the role',
  'Employee actively employed, not under notice, on the date the bonus becomes payable',
  'Bonus not already paid for the same or an equivalent credential',
]

export default function CertificationBonusPanel({ userRole, userName }: { userRole: string; userName: string }) {
  const [subTab, setSubTab] = useState<'calculator' | 'tracker' | 'catalog'>('calculator')
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [records, setRecords] = useState<CertRecord[]>([])
  const [joinDate, setJoinDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const isAdmin = userRole === 'admin'

  // Calculator state
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('custom')
  const [customLevel, setCustomLevel] = useState<'foundational' | 'intermediate' | 'advanced'>('foundational')
  const [customName, setCustomName] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [examFee, setExamFee] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')

  // Admin catalog add form
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState<{ name: string; vendor: string; level: 'foundational' | 'intermediate' | 'advanced'; bonusAmount: number }>({ name: '', vendor: 'Microsoft', level: 'foundational', bonusAmount: 25000 })

  // Admin record edit
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, recRes, usersRes] = await Promise.all([
        fetch('/api/certification-catalog'),
        fetch('/api/certification-records'),
        fetch('/api/users'),
      ])
      const catData = await catRes.json()
      const recData = await recRes.json()
      const usersData = await usersRes.json()
      setCatalog(Array.isArray(catData) ? catData : [])
      setRecords(Array.isArray(recData) ? recData : [])
      const me = usersData?.users?.find((u: any) => u.name === userName)
      setJoinDate(me?.createdAt ? new Date(me.createdAt) : null)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [userName])

  useEffect(() => { fetchAll() }, [fetchAll])

  const myRecords = isAdmin ? records : records.filter(r => r.employeeName === userName)

  // First-year cap calculation (employee view)
  const now = new Date()
  const withinFirstYear = joinDate ? (now.getTime() - joinDate.getTime()) < 365 * 24 * 60 * 60 * 1000 : false
  const firstYearEnd = joinDate ? new Date(joinDate.getTime() + 365 * 24 * 60 * 60 * 1000) : null
  const usedTowardCap = myRecords
    .filter(r => ['earned', 'payable', 'paid'].includes(r.status))
    .filter(r => joinDate && firstYearEnd && new Date(r.requestedAt) <= firstYearEnd)
    .reduce((sum, r) => sum + (r.bonusAmount || 0), 0)
  const capRemaining = Math.max(0, FIRST_YEAR_CAP - usedTowardCap)

  // Calculator derived values
  const catalogItem = catalog.find(c => c._id === selectedCatalogId)
  const calcLevel = catalogItem ? catalogItem.level : customLevel
  const calcName = catalogItem ? catalogItem.name : customName
  const calcAmount = catalogItem ? catalogItem.bonusAmount : (customLevel === 'advanced' ? (parseFloat(customAmount) || 0) : LEVEL_DEFAULT[customLevel])
  const exceedsCapThisYear = withinFirstYear && calcAmount > capRemaining

  async function submitRequest() {
    if (!calcName.trim()) { setSubmitMsg('Enter a certification name.'); return }
    if (calcLevel === 'advanced' && !catalogItem && calcAmount === 0) { setSubmitMsg('Advanced bonus amount must be confirmed by the MD first — submit as a request and leave amount for the MD to set.'); }
    setSubmitting(true)
    try {
      await fetch('/api/certification-records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: userName,
          catalogItemId: catalogItem?._id,
          certName: calcName,
          vendor: catalogItem?.vendor || 'Microsoft',
          level: calcLevel,
          bonusAmount: calcAmount,
          examFee: parseFloat(examFee) || undefined,
        }),
      })
      setSubmitMsg('Request submitted — awaiting MD written approval before you enroll.')
      setCustomName(''); setCustomAmount(''); setExamFee('')
      fetchAll()
      setSubTab('tracker')
    } catch { setSubmitMsg('Failed to submit request.') }
    finally { setSubmitting(false) }
  }

  async function updateRecord(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/certification-records/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    fetchAll()
  }

  async function addCatalogItem() {
    if (!newCat.name.trim()) return
    await fetch('/api/certification-catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCat) })
    setNewCat({ name: '', vendor: 'Microsoft', level: 'foundational', bonusAmount: 25000 })
    setShowAddCat(false)
    fetchAll()
  }

  async function removeCatalogItem(id: string) {
    if (!confirm('Remove this certification from the approved catalog?')) return
    await fetch(`/api/certification-catalog/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  function nextStatusActions(r: CertRecord): { label: string; status: string; cls: string }[] {
    const idx = STATUS_FLOW.indexOf(r.status)
    const actions: { label: string; status: string; cls: string }[] = []
    if (r.status === 'requested') {
      actions.push({ label: 'Approve to Enroll', status: 'approved_to_enroll', cls: 'bg-indigo-600' })
      actions.push({ label: 'Deny', status: 'denied', cls: 'bg-red-600' })
    } else if (r.status === 'submitted') {
      actions.push({ label: 'Verify Credential', status: 'verified', cls: 'bg-purple-600' })
      actions.push({ label: 'Deny', status: 'denied', cls: 'bg-red-600' })
    } else if (idx >= 0 && idx < STATUS_FLOW.length - 1 && !['requested', 'submitted'].includes(r.status)) {
      const next = STATUS_FLOW[idx + 1]
      actions.push({ label: `Mark ${STATUS_LABEL[next]}`, status: next, cls: 'bg-primary' })
    }
    return actions
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['calculator', 'tracker', 'catalog'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${subTab === t ? 'bg-primary text-white' : 'bg-secondary/40 text-muted-foreground hover:bg-secondary'}`}>
            {t === 'calculator' ? '🧮 Bonus Calculator' : t === 'tracker' ? '📋 My Certifications' : '📚 Approved Catalog'}
          </button>
        ))}
      </div>

      {/* CALCULATOR */}
      {subTab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Certification</label>
              <select value={selectedCatalogId} onChange={e => setSelectedCatalogId(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white">
                <option value="custom">Custom / not yet in catalog</option>
                {catalog.map(c => (
                  <option key={c._id} value={c._id}>{c.name} — {LEVEL_LABEL[c.level]} ({fmt(c.bonusAmount)})</option>
                ))}
              </select>
            </div>

            {selectedCatalogId === 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Certification name</label>
                  <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Azure Administrator (AZ-104)"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['foundational', 'intermediate', 'advanced'] as const).map(l => (
                      <button key={l} onClick={() => setCustomLevel(l)}
                        className={`rounded-lg border py-2 text-xs font-medium transition-colors ${customLevel === l ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:bg-secondary'}`}>
                        {LEVEL_LABEL[l]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{LEVEL_RANGE[customLevel]}</p>
                </div>
                {customLevel === 'advanced' && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Proposed amount (₦75,000–₦100,000)</label>
                    <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="To be confirmed by MD"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                    <p className="text-[10px] text-amber-700 mt-1">The exact amount must be confirmed in writing by the MD before you register.</p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estimated exam fee (optional, for reimbursement)</label>
              <input type="number" value={examFee} onChange={e => setExamFee(e.target.value)} placeholder="₦"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>

            <button onClick={submitRequest} disabled={submitting}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit Pre-Approval Request'}
            </button>
            {submitMsg && <p className="text-xs text-muted-foreground">{submitMsg}</p>}
          </div>

          {/* Results panel */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Forecast Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Certification</span>
                <span className="font-medium text-right">{calcName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="font-medium">{LEVEL_LABEL[calcLevel]}</span>
              </div>
              <div className="border-t border-primary/20 pt-2 flex justify-between">
                <span className="font-semibold text-foreground">One-time bonus</span>
                <span className="font-bold text-primary text-base">{calcAmount > 0 ? fmt(calcAmount) : 'TBC by MD'}</span>
              </div>
            </div>

            {joinDate && (
              <div className="rounded-lg bg-white border border-border px-3 py-2.5 space-y-1">
                <p className="text-xs font-semibold text-foreground">First-Year Bonus Cap (₦100,000)</p>
                <p className="text-xs text-muted-foreground">
                  {withinFirstYear
                    ? <>Used so far: <span className="font-medium">{fmt(usedTowardCap)}</span> · Remaining: <span className="font-medium text-teal-700">{fmt(capRemaining)}</span></>
                    : 'Outside first 12 months — cap no longer applies (subject to MD approval for any cap increase).'}
                </p>
                {exceedsCapThisYear && (
                  <p className="text-[10px] text-amber-700">This bonus would exceed your remaining first-year cap — MD written approval needed to pay above ₦100,000 in year one.</p>
                )}
              </div>
            )}

            <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
              <p className="text-xs font-semibold text-foreground mb-1.5">To be earned, all must be true:</p>
              <ul className="space-y-1">
                {ELIGIBILITY_CONDITIONS.map((c, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5"><span>•</span><span>{c}</span></li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-[10px] text-amber-800 leading-relaxed">
              This is a forecast only. Actual bonus is subject to the Certification Bonus Addendum REF#01010 and MD approval before enrollment.
            </div>
          </div>
        </div>
      )}

      {/* TRACKER */}
      {subTab === 'tracker' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
          ) : myRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No certification requests yet — submit one from the Bonus Calculator tab.</p>
          ) : (
            <div className="space-y-3">
              {myRecords.map(r => (
                <div key={r._id} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.certName}</p>
                      <p className="text-xs text-muted-foreground">{isAdmin ? `${r.employeeName} · ` : ''}{LEVEL_LABEL[r.level]} · {fmt(r.bonusAmount)}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>

                  {/* Employee action: submit proof once approved */}
                  {!isAdmin && r.status === 'approved_to_enroll' && (
                    <div className="flex gap-2 pt-1">
                      <input placeholder="Credential ID / verification link" defaultValue={r.credentialId || ''}
                        onBlur={e => updateRecord(r._id, { credentialId: e.target.value })}
                        className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs" />
                      <button onClick={() => updateRecord(r._id, { status: 'submitted' })}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap">
                        Submit Proof
                      </button>
                    </div>
                  )}

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {nextStatusActions(r).map(a => (
                        <button key={a.status} onClick={() => updateRecord(r._id, { status: a.status })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white ${a.cls}`}>
                          {a.label}
                        </button>
                      ))}
                      <input placeholder="Admin note" defaultValue={r.adminNotes || ''}
                        onBlur={e => updateRecord(r._id, { adminNotes: e.target.value })}
                        className="flex-1 min-w-[140px] rounded-lg border border-border px-3 py-1.5 text-xs" />
                    </div>
                  )}

                  {r.credentialId && <p className="text-[10px] text-muted-foreground">Credential: {r.credentialId}</p>}
                  {r.adminNotes && <p className="text-[10px] text-muted-foreground italic">Note: {r.adminNotes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CATALOG */}
      {subTab === 'catalog' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={() => setShowAddCat(!showAddCat)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                + Add Approved Certification
              </button>
            </div>
          )}
          {showAddCat && isAdmin && (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
              <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                placeholder="Certification name" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input value={newCat.vendor} onChange={e => setNewCat(p => ({ ...p, vendor: e.target.value }))}
                  placeholder="Vendor" className="rounded-lg border border-border px-3 py-2 text-sm" />
                <select value={newCat.level} onChange={e => {
                  const level = e.target.value as 'foundational' | 'intermediate' | 'advanced'
                  setNewCat(p => ({ ...p, level, bonusAmount: LEVEL_DEFAULT[level] || p.bonusAmount }))
                }} className="rounded-lg border border-border px-3 py-2 text-sm bg-white">
                  <option value="foundational">Foundational (₦25,000)</option>
                  <option value="intermediate">Intermediate (₦50,000)</option>
                  <option value="advanced">Advanced (₦75,000–₦100,000)</option>
                </select>
              </div>
              <input type="number" value={newCat.bonusAmount} onChange={e => setNewCat(p => ({ ...p, bonusAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="Bonus amount" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddCat(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>
                <button onClick={addCatalogItem} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">Save</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  {['Certification', 'Vendor', 'Level', 'Bonus', ...(isAdmin ? ['Action'] : [])].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catalog.map(c => (
                  <tr key={c._id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.vendor}</td>
                    <td className="px-4 py-3 text-xs">{LEVEL_LABEL[c.level]}</td>
                    <td className="px-4 py-3 text-xs font-medium text-primary">{fmt(c.bonusAmount)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => removeCatalogItem(c._id)} className="text-xs text-red-600 hover:underline">Remove</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
