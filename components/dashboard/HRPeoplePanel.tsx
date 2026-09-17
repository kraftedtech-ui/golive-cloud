"use client"
import { useEffect, useState } from "react"
import { RefreshCw, ChevronDown, ChevronUp, BadgeCheck, Clock, FileText,
         Download, Upload, User, Mail, Briefcase, Hash, CheckCircle,
         AlertTriangle, ShieldCheck, GraduationCap } from "lucide-react"

type EmpDoc = { filename: string; label?: string; uploadedAt?: string; executedExternally?: boolean }
type Certification = {
  name?: string; source?: string; voucherIssuedAt?: string; deadline?: string
  scheduledFor?: string; completedAt?: string
}
type Employee = {
  _id: string; employeeNumber: string; name: string; email: string; workEmail?: string
  role: string; jobCode?: string; employmentType?: string
  status: 'probation' | 'active' | 'exited'
  legacyHire?: boolean; applicationRef?: string | null; portalUserId?: string
  startDate?: string; probationEndDate?: string; confirmedAt?: string; exitedAt?: string
  certification?: Certification; docs?: EmpDoc[]; notes?: string
}
type Detail = {
  employee: Employee
  application?: {
    ref: string; status: string
    offer?: { sentAt?: string; candidateSignedAt?: string; mdSignedAt?: string }
    onboarding?: { docs?: { filename: string; label?: string; acknowledgedAt?: string }[]; acknowledgedAt?: string; mdAckAt?: string }
    screening?: { status?: string; clearedAt?: string }
  } | null
  portalUser?: {
    name: string; email: string; role: string; active: boolean
    lastLogin?: string; confirmedAt?: string; commissionEligible?: boolean
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  probation: 'bg-amber-50 text-amber-700 border-amber-200',
  active:    'bg-green-50 text-green-700 border-green-200',
  exited:    'bg-gray-100 text-gray-600 border-gray-300',
}

// Dates are stored as UTC midnight, so they MUST be formatted in UTC.
// Rendering them in a timezone behind UTC rolls every date back a day, which
// on a probation-confirmation or voucher-expiry date is a real error.
const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '\u2014'
const isoDay = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '')
const daysUntil = (d?: string) =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null

function DeadlineChip({ label, date }: { label: string; date?: string }) {
  const days = daysUntil(date)
  if (days === null) return null
  const tone =
    days < 0 ? 'bg-red-100 text-red-700 ring-red-200'
    : days <= 30 ? 'bg-red-50 text-red-600 ring-red-200'
    : days <= 60 ? 'bg-amber-50 text-amber-700 ring-amber-200'
    : 'bg-blue-50 text-blue-700 ring-blue-200'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tone}`}>
      <Clock className="size-3" />
      {label}: {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`} ({fmt(date)})
    </span>
  )
}

export default function HRPeoplePanel() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [cert, setCert] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      setEmployees(data.employees || [])
    } catch { setEmployees([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function openDetail(id: string) {
    if (expanded === id) { setExpanded(null); setDetail(null); return }
    setExpanded(id)
    setDetail(null)
    setDetailLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/employees/${id}`)
      const data = await res.json()
      if (data.employee) {
        setDetail(data)
        const e: Employee = data.employee
        setForm({
          workEmail: e.workEmail || '',
          employmentType: e.employmentType || 'full-time',
          status: e.status || 'probation',
          startDate: isoDay(e.startDate),
          probationEndDate: isoDay(e.probationEndDate),
          confirmedAt: isoDay(e.confirmedAt),
          notes: e.notes || '',
        })
        setCert({
          name: e.certification?.name || '',
          source: e.certification?.source || '',
          voucherIssuedAt: isoDay(e.certification?.voucherIssuedAt),
          deadline: isoDay(e.certification?.deadline),
          scheduledFor: isoDay(e.certification?.scheduledFor),
          completedAt: isoDay(e.certification?.completedAt),
        })
      }
    } finally { setDetailLoading(false) }
  }

  async function save(id: string, extra?: Record<string, unknown>) {
    setSaving(true)
    setMsg(null)
    try {
      const body: Record<string, unknown> = {
        workEmail: form.workEmail || null,
        employmentType: form.employmentType,
        status: form.status,
        startDate: form.startDate || null,
        probationEndDate: form.probationEndDate || null,
        confirmedAt: form.confirmedAt || null,
        notes: form.notes,
        certification: {
          name: cert.name || null, source: cert.source || null,
          voucherIssuedAt: cert.voucherIssuedAt || null, deadline: cert.deadline || null,
          scheduledFor: cert.scheduledFor || null, completedAt: cert.completedAt || null,
        },
        ...extra,
      }
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || 'Save failed'); return }
      setMsg(data.userSynced
        ? 'Saved. Portal account confirmation synced; commission rates follow the confirmed schedule.'
        : 'Saved.')
      await load()
      await openDetailRefresh(id)
    } finally { setSaving(false) }
  }

  async function openDetailRefresh(id: string) {
    const res = await fetch(`/api/employees/${id}`)
    const data = await res.json()
    if (data.employee) setDetail(data)
  }

  async function markConfirmed(id: string, name: string) {
    if (!window.confirm(
      `Confirm ${name} in writing as of today?\n\nThis records confirmedAt on the employee file and syncs the portal account, which moves commissions to the post-confirmation schedule. Issue the written confirmation letter alongside this.`
    )) return
    const today = new Date().toISOString().slice(0, 10)
    setForm(f => ({ ...f, confirmedAt: today, status: 'active' }))
    await save(id, { confirmedAt: today, status: 'active' })
  }

  async function uploadDoc(id: string, file: File) {
    setUploading(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/employees/${id}/docs`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || 'Upload failed'); return }
      setMsg(`Uploaded ${data.filename}.`)
      await openDetailRefresh(id)
    } finally { setUploading(false) }
  }

  const field = "w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
  const label = "text-[10px] font-semibold uppercase tracking-wide text-gray-500"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">People</h2>
          <p className="text-sm text-gray-500">
            Employee records: the layer the candidate pipeline feeds. Lifecycle dates, confirmation, certification, and the document file.
          </p>
        </div>
        <button onClick={load}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-border hover:bg-gray-50">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Loading…</div>
      ) : employees.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          No employee records yet. Run <code className="rounded bg-gray-100 px-1">scripts/backfill-employees.js</code> on the server to create GL-EMP-001 (Henry) and convert countersigned hires.
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((e) => {
            const isOpen = expanded === e._id
            const d = isOpen ? detail : null
            return (
              <div key={e._id} className="rounded-2xl border border-border bg-white shadow-sm">
                <button onClick={() => openDetail(e._id)} className="flex w-full items-center gap-4 px-5 py-4 text-left">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-chart-2)] to-primary text-sm font-semibold text-white">
                    {e.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{e.name}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200">
                        <Hash className="size-3" />{e.employeeNumber}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[e.status] || STATUS_COLORS.probation}`}>
                        {e.status}
                      </span>
                      {e.legacyHire && (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                          Legacy hire
                        </span>
                      )}
                      {e.portalUserId && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                          <ShieldCheck className="size-3" /> Portal linked
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><Briefcase className="size-3" />{e.role}{e.jobCode ? ` \u00B7 ${e.jobCode}` : ''}</span>
                      <span className="capitalize">{e.employmentType || 'full-time'}</span>
                      <span>Started {fmt(e.startDate)}</span>
                      {e.confirmedAt
                        ? <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle className="size-3" />Confirmed {fmt(e.confirmedAt)}</span>
                        : <DeadlineChip label="Confirmation due" date={e.probationEndDate} />}
                      {!e.certification?.completedAt && e.certification?.deadline && (
                        <DeadlineChip label={`${e.certification?.name || 'Certification'} exam`} date={e.certification.deadline} />
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="size-4 shrink-0 text-gray-400" /> : <ChevronDown className="size-4 shrink-0 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 py-4">
                    {detailLoading || !d ? (
                      <p className="text-sm text-gray-500">Loading file…</p>
                    ) : (
                      <div className="space-y-5">
                        {msg && (
                          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 ring-1 ring-blue-200">{msg}</div>
                        )}

                        <div className="grid gap-5 lg:grid-cols-3">
                          {/* Employment */}
                          <div className="rounded-xl border border-border bg-gray-50/60 p-4">
                            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-700"><User className="size-3.5" /> Employment</p>
                            <div className="space-y-2.5">
                              <div><p className={label}>Work email</p>
                                <input className={field} value={form.workEmail} placeholder="name@golivecompany.com"
                                  onChange={ev => setForm(f => ({ ...f, workEmail: ev.target.value }))} /></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><p className={label}>Type</p>
                                  <select className={field} value={form.employmentType}
                                    onChange={ev => setForm(f => ({ ...f, employmentType: ev.target.value }))}>
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                  </select></div>
                                <div><p className={label}>Status</p>
                                  <select className={field} value={form.status}
                                    onChange={ev => setForm(f => ({ ...f, status: ev.target.value }))}>
                                    <option value="probation">Probation</option>
                                    <option value="active">Active</option>
                                    <option value="exited">Exited</option>
                                  </select></div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><p className={label}>Start date</p>
                                  <input type="date" className={field} value={form.startDate}
                                    onChange={ev => setForm(f => ({ ...f, startDate: ev.target.value }))} /></div>
                                <div><p className={label}>Probation ends</p>
                                  <input type="date" className={field} value={form.probationEndDate}
                                    onChange={ev => setForm(f => ({ ...f, probationEndDate: ev.target.value }))} /></div>
                              </div>
                              <div><p className={label}>Confirmed (written)</p>
                                <input type="date" className={field} value={form.confirmedAt}
                                  onChange={ev => setForm(f => ({ ...f, confirmedAt: ev.target.value }))} /></div>
                              {!d.employee.confirmedAt && (
                                <button onClick={() => markConfirmed(e._id, e.name)} disabled={saving}
                                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                                  <BadgeCheck className="size-4" /> Mark confirmed today
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Certification */}
                          <div className="rounded-xl border border-border bg-gray-50/60 p-4">
                            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-700"><GraduationCap className="size-3.5" /> Certification</p>
                            <div className="space-y-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <div><p className={label}>Exam</p>
                                  <input className={field} value={cert.name} placeholder="AB-900"
                                    onChange={ev => setCert(c => ({ ...c, name: ev.target.value }))} /></div>
                                <div><p className={label}>Voucher source</p>
                                  <input className={field} value={cert.source} placeholder="4Sight"
                                    onChange={ev => setCert(c => ({ ...c, source: ev.target.value }))} /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><p className={label}>Voucher issued</p>
                                  <input type="date" className={field} value={cert.voucherIssuedAt}
                                    onChange={ev => setCert(c => ({ ...c, voucherIssuedAt: ev.target.value }))} /></div>
                                <div><p className={label}>Hard deadline</p>
                                  <input type="date" className={field} value={cert.deadline}
                                    onChange={ev => setCert(c => ({ ...c, deadline: ev.target.value }))} /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><p className={label}>Exam scheduled</p>
                                  <input type="date" className={field} value={cert.scheduledFor}
                                    onChange={ev => setCert(c => ({ ...c, scheduledFor: ev.target.value }))} /></div>
                                <div><p className={label}>Passed on</p>
                                  <input type="date" className={field} value={cert.completedAt}
                                    onChange={ev => setCert(c => ({ ...c, completedAt: ev.target.value }))} /></div>
                              </div>
                              {!cert.completedAt && cert.deadline && (
                                <div className="pt-1"><DeadlineChip label="Exam" date={cert.deadline} /></div>
                              )}
                            </div>
                          </div>

                          {/* Links */}
                          <div className="rounded-xl border border-border bg-gray-50/60 p-4">
                            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-700"><ShieldCheck className="size-3.5" /> Linked records</p>
                            <div className="space-y-3 text-xs text-gray-600">
                              <div>
                                <p className={label}>Portal account</p>
                                {d.portalUser ? (
                                  <div className="mt-1 space-y-0.5">
                                    <p className="inline-flex items-center gap-1"><Mail className="size-3" />{d.portalUser.email} · <span className="uppercase">{d.portalUser.role}</span> · {d.portalUser.active ? 'active' : 'disabled'}</p>
                                    <p>Last login: {fmt(d.portalUser.lastLogin)}</p>
                                    <p>Commission profile: {d.portalUser.confirmedAt ? `confirmed ${fmt(d.portalUser.confirmedAt)}` : 'probationary rates'}</p>
                                  </div>
                                ) : <p className="mt-1 text-gray-400">No portal account linked yet.</p>}
                              </div>
                              <div>
                                <p className={label}>Hiring pipeline</p>
                                {d.application ? (
                                  <div className="mt-1 space-y-0.5">
                                    <p>{d.application.ref} · status: <span className="capitalize">{d.application.status}</span></p>
                                    <p>Offer executed: {fmt(d.application.offer?.mdSignedAt)}</p>
                                    <p>Onboarding acknowledged: {fmt(d.application.onboarding?.acknowledgedAt)}</p>
                                    <p>BCI screening: <span className="capitalize">{d.application.screening?.status || '\u2014'}</span></p>
                                  </div>
                                ) : (
                                  <p className="mt-1 inline-flex items-center gap-1 text-purple-600">
                                    <AlertTriangle className="size-3" /> Legacy hire: predates the candidate pipeline; documents executed externally.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Documents */}
                        <div className="rounded-xl border border-border bg-gray-50/60 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700"><FileText className="size-3.5" /> Document file</p>
                            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 ring-1 ring-border hover:bg-gray-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Upload className="size-3.5" /> {uploading ? 'Uploading\u2026' : 'Add document'}
                              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx"
                                onChange={ev => { const f = ev.target.files?.[0]; if (f) uploadDoc(e._id, f); ev.target.value = '' }} />
                            </label>
                          </div>
                          <div className="space-y-1.5">
                            {(d.application?.onboarding?.docs || []).map(doc => (
                              <div key={`app-${doc.filename}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-border">
                                <div className="min-w-0 text-xs">
                                  <p className="truncate font-medium text-gray-800">{doc.label || doc.filename}</p>
                                  <p className="text-[10px] text-gray-400">From hiring pipeline{doc.acknowledgedAt ? ` \u00B7 acknowledged ${fmt(doc.acknowledgedAt)}` : ''}</p>
                                </div>
                                <a href={`/api/employees/${e._id}/docs?f=${encodeURIComponent(doc.filename)}&src=application`}
                                  className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-200">
                                  <Download className="size-3" /> Download
                                </a>
                              </div>
                            ))}
                            {(d.employee.docs || []).map(doc => (
                              <div key={`emp-${doc.filename}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-border">
                                <div className="min-w-0 text-xs">
                                  <p className="truncate font-medium text-gray-800">{doc.label || doc.filename}</p>
                                  <p className="text-[10px] text-gray-400">{doc.executedExternally ? 'Executed externally' : 'Employee file'} · uploaded {fmt(doc.uploadedAt)}</p>
                                </div>
                                <a href={`/api/employees/${e._id}/docs?f=${encodeURIComponent(doc.filename)}&src=employee`}
                                  className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-200">
                                  <Download className="size-3" /> Download
                                </a>
                              </div>
                            ))}
                            {!(d.application?.onboarding?.docs?.length) && !(d.employee.docs?.length) && (
                              <p className="text-xs text-gray-400">No documents on file yet.</p>
                            )}
                          </div>
                        </div>

                        {/* Notes + save */}
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className={label}>Notes</p>
                            <textarea rows={2} className={field} value={form.notes}
                              onChange={ev => setForm(f => ({ ...f, notes: ev.target.value }))} />
                          </div>
                          <div>
                            <button onClick={() => save(e._id)} disabled={saving}
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                              {saving ? 'Saving\u2026' : 'Save changes'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
