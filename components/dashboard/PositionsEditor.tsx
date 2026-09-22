"use client"
import { useEffect, useState } from "react"
import { Plus, RefreshCw, ExternalLink, Pencil, UserPlus, Undo2, Trash2 } from "lucide-react"

type Hire = { employeeNumber?: string; applicationRef?: string; name: string; hiredAt: string }
type Position = {
  _id: string; slug: string; title: string; department: string; type: string; location: string
  salaryLower: number; salaryUpper: number; commission: boolean; summary: string
  responsibilities: string[]; requirements: string[]
  status: 'draft' | 'open' | 'closed'; openings: number; hires: Hire[]; filledOn?: string | null
}

const blank = {
  title: '', department: '', type: 'Full-time', location: 'Lagos, hybrid',
  salaryLower: '', salaryUpper: '', commission: false, openings: '1',
  summary: '', responsibilities: '', requirements: '',
}
type Form = typeof blank

const naira = (n: number) => '\u20a6' + Number(n || 0).toLocaleString('en-NG')
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''

function stateOf(p: Position): { label: string; tone: string } {
  const left = Math.max(0, p.openings - p.hires.length)
  if (p.status === 'draft') return { label: 'Draft', tone: 'bg-gray-100 text-gray-700 ring-gray-200' }
  if (p.status === 'closed') return { label: 'Closed', tone: 'bg-gray-100 text-gray-500 ring-gray-200' }
  if (left === 0) return { label: 'Filled', tone: 'bg-green-50 text-green-700 ring-green-200' }
  return { label: 'Open', tone: 'bg-sky-50 text-sky-700 ring-sky-200' }
}

export default function PositionsEditor() {
  const [rows, setRows] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<Form>(blank)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const [hireFor, setHireFor] = useState<string | null>(null)
  const [hireNum, setHireNum] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/positions')
      const d = await r.json()
      setRows(d.positions || [])
    } catch { setRows([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function startNew() { setForm(blank); setEditing('new'); setMsg(null) }
  function startEdit(p: Position) {
    setForm({
      title: p.title, department: p.department, type: p.type, location: p.location,
      salaryLower: String(p.salaryLower), salaryUpper: String(p.salaryUpper), commission: p.commission,
      openings: String(p.openings), summary: p.summary,
      responsibilities: p.responsibilities.join('\n'), requirements: p.requirements.join('\n'),
    })
    setEditing(p._id); setMsg(null)
  }

  async function save() {
    setBusy(true); setMsg(null)
    try {
      const isNew = editing === 'new'
      const r = await fetch(isNew ? '/api/positions' : `/api/positions/${editing}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { setMsg({ text: d.error || 'Could not save.', bad: true }); return }
      setMsg({ text: isNew ? 'Saved as a draft. Open it when you are ready to publish it on the careers page.' : 'Saved. The careers page reflects this now.' })
      setEditing(null)
      await load()
    } finally { setBusy(false) }
  }

  async function setStatus(p: Position, status: Position['status']) {
    const verb = status === 'open' ? 'Publish' : status === 'closed' ? 'Close' : 'Move to draft'
    if (!window.confirm(`${verb} "${p.title}"?${status === 'open' ? '\n\nIt will appear on the public careers page immediately.' : '\n\nIt will be removed from the public careers page.'}`)) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/positions/${p._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      })
      const d = await r.json()
      if (!r.ok) { setMsg({ text: d.error || 'Could not update.', bad: true }); return }
      await load()
    } finally { setBusy(false) }
  }

  async function remove(p: Position) {
    if (!window.confirm(`Delete "${p.title}" permanently?`)) return
    const r = await fetch(`/api/positions/${p._id}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) { setMsg({ text: d.error || 'Could not delete.', bad: true }); return }
    await load()
  }

  async function addHire(p: Position) {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/positions/${p._id}/hires`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeNumber: hireNum }),
      })
      const d = await r.json()
      if (!r.ok) { setMsg({ text: d.error || 'Could not record the hire.', bad: true }); return }
      setHireFor(null); setHireNum('')
      await load()
    } finally { setBusy(false) }
  }

  async function undoHire(p: Position, h: Hire) {
    if (!window.confirm(`Remove ${h.name} from "${p.title}"?\n\nIf this leaves an opening unfilled, the position reopens on the careers page.`)) return
    const q = h.employeeNumber ? `employeeNumber=${encodeURIComponent(h.employeeNumber)}` : `applicationRef=${encodeURIComponent(h.applicationRef || '')}`
    const r = await fetch(`/api/positions/${p._id}/hires?${q}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) { setMsg({ text: d.error || 'Could not undo.', bad: true }); return }
    await load()
  }

  const field = "w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
  const label = "mb-1 block text-xs font-medium text-gray-600"

  const editor = (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">{editing === 'new' ? 'New position' : 'Edit position'}</h3>
      <div className="grid gap-3 md:grid-cols-6">
        <div className="md:col-span-3"><label className={label}>Title</label>
          <input className={field} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="md:col-span-3"><label className={label}>Team</label>
          <input className={field} value={form.department} placeholder="e.g. Sales & Customer Relations" onChange={e => setForm({ ...form, department: e.target.value })} /></div>
        <div className="md:col-span-2"><label className={label}>Type</label>
          <select className={field} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
          </select></div>
        <div className="md:col-span-2"><label className={label}>Location</label>
          <input className={field} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
        <div className="md:col-span-2"><label className={label}>Openings</label>
          <input type="number" min={1} className={field} value={form.openings} onChange={e => setForm({ ...form, openings: e.target.value })} /></div>
        <div className="md:col-span-2"><label className={label}>Monthly gross from (₦)</label>
          <input inputMode="numeric" className={field} value={form.salaryLower} onChange={e => setForm({ ...form, salaryLower: e.target.value.replace(/[^0-9]/g, '') })} /></div>
        <div className="md:col-span-2"><label className={label}>Monthly gross to (₦)</label>
          <input inputMode="numeric" className={field} value={form.salaryUpper} onChange={e => setForm({ ...form, salaryUpper: e.target.value.replace(/[^0-9]/g, '') })} /></div>
        <div className="flex items-end md:col-span-2">
          <label className="flex items-center gap-2 pb-1.5 text-sm text-gray-700">
            <input type="checkbox" checked={form.commission} onChange={e => setForm({ ...form, commission: e.target.checked })} />
            Carries commission
          </label></div>
        <div className="md:col-span-6"><label className={label}>Summary</label>
          <textarea rows={2} className={field} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
        <div className="md:col-span-3"><label className={label}>What you will do (one per line)</label>
          <textarea rows={6} className={field} value={form.responsibilities} onChange={e => setForm({ ...form, responsibilities: e.target.value })} /></div>
        <div className="md:col-span-3"><label className={label}>What we are looking for (one per line)</label>
          <textarea rows={6} className={field} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} /></div>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={save} disabled={busy} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50">
          {busy ? 'Saving\u2026' : 'Save position'}</button>
        <button onClick={() => setEditing(null)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Positions</h2>
          <p className="text-sm text-gray-500">What the public careers page shows. Hires are recorded automatically when an offer is countersigned.</p>
        </div>
        <div className="flex gap-2">
          <a href="/careers" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ExternalLink className="size-4" /> View careers page</a>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
          <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">
            <Plus className="size-4" /> New position</button>
        </div>
      </div>

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ring-1 ${msg.bad ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-sky-50 text-sky-800 ring-sky-200'}`}>{msg.text}</div>
      )}

      {editing === 'new' && editor}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading positions…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">No positions yet. Create one to publish it on the careers page.</div>
      ) : (
        <div className="space-y-3">
          {rows.map(p => {
            const st = stateOf(p)
            const left = Math.max(0, p.openings - p.hires.length)
            return (
              <div key={p._id}>
                {editing === p._id ? editor : (
                  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">{p.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.tone}`}>{st.label}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {p.department}, {p.type.toLowerCase()}, {naira(p.salaryLower)} to {naira(p.salaryUpper)} a month{p.commission ? ' plus commission' : ''}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <strong>{p.hires.length} of {p.openings}</strong> {p.openings === 1 ? 'opening' : 'openings'} filled
                          {p.status === 'open' && left > 0 ? `, ${left} still open` : ''}
                          {p.filledOn ? `, filled ${fmtDate(p.filledOn)}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => startEdit(p)} className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                          <Pencil className="size-3.5" /> Edit</button>
                        {p.status !== 'open' && (
                          <button onClick={() => setStatus(p, 'open')} disabled={busy} className="rounded-md bg-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50">Publish</button>
                        )}
                        {p.status === 'open' && (
                          <button onClick={() => setStatus(p, 'closed')} disabled={busy} className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Close</button>
                        )}
                        {p.hires.length === 0 && p.status !== 'open' && (
                          <button onClick={() => remove(p)} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">
                            <Trash2 className="size-3.5" /> Delete</button>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 px-4 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-600">Hires</p>
                        <button onClick={() => { setHireFor(hireFor === p._id ? null : p._id); setHireNum('') }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline">
                          <UserPlus className="size-3.5" /> Record a hire</button>
                      </div>
                      {hireFor === p._id && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          <input className={`${field} max-w-[220px]`} placeholder="Employee number, e.g. GL-EMP-003" value={hireNum} onChange={e => setHireNum(e.target.value)} />
                          <button onClick={() => addHire(p)} disabled={busy || !hireNum.trim()} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50">Record</button>
                        </div>
                      )}
                      {p.hires.length === 0 ? (
                        <p className="text-xs text-gray-400">No hires recorded yet.</p>
                      ) : (
                        <ul className="space-y-1">
                          {p.hires.map((h, i) => (
                            <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs">
                              <span className="text-gray-800">
                                <strong>{h.name}</strong>
                                {h.employeeNumber ? `, ${h.employeeNumber}` : ''}
                                {h.applicationRef ? `, from ${h.applicationRef}` : ''}
                                <span className="text-gray-500">, recorded {fmtDate(h.hiredAt)}</span>
                              </span>
                              <button onClick={() => undoHire(p, h)} className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-red-700">
                                <Undo2 className="size-3.5" /> Undo</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
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
