"use client"
import { useEffect, useMemo, useState } from "react"
import { RefreshCw, ChevronDown, ChevronUp, Check, X, Flag, CalendarPlus, Trophy, XCircle } from "lucide-react"
import DealCommission from "./DealCommission"

type Deal = {
  _id: string; ref: string; partnerNumber: string; partnerName: string; partnerEmail: string; category: string; source: string
  organisation: string; sector?: string; contactName?: string; contactRole?: string; contactEmail?: string; contactPhone?: string
  lineOfBusiness?: string; requirement?: string; estimatedValue?: number; expectedClose?: string
  status: string; conflict?: { kind: string; match: string; owner?: string } | null
  submittedAt: string; approvedAt?: string; approvedBy?: string; decisionNote?: string; scheduleVersion?: number
  validUntil?: string; hardLimit?: string; closedAt?: string; validAtClose?: boolean; whmcsClientId?: number; whmcsLine?: string
  milestones: { kind: string; at: string; by: string; note?: string }[]
  timeline: { at: string; by: string; action: string; note?: string }[]
}

const LABEL: Record<string, string> = { pending: "Awaiting approval", active: "Registered", lapsed: "Lapsed", refused: "Refused", won: "Won", lost: "Lost", released: "Released" }
const TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200", active: "bg-green-50 text-green-700 border-green-200", lapsed: "bg-red-50 text-[#c50f1f] border-red-200",
  refused: "bg-gray-100 text-gray-600 border-gray-300", won: "bg-sky-50 text-sky-700 border-sky-200", lost: "bg-gray-100 text-gray-600 border-gray-300", released: "bg-gray-100 text-gray-600 border-gray-300",
}
const MS: Record<string, string> = { meeting: "Meeting attended by GoLive", quotation: "GoLive quotation or proposal", written_confirmation: "Prospect's written confirmation to GoLive" }
const KIND: Record<string, string> = { customer: "Existing customer", lead: "In sales pipeline", partner: "Another partner" }
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "\u2014")
const fmtDT = (d?: string) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }) + " WAT" : "\u2014")
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" })
const btn = "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d1d1d1] bg-white px-3 text-sm font-semibold text-[#242424] hover:bg-[#f5f5f5] disabled:opacity-50"
const primary = "inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#0f8fb0] px-3 text-sm font-semibold text-white hover:bg-[#0b7e9b] disabled:opacity-50"
const input = "h-8 rounded-[4px] border border-[#d1d1d1] bg-white px-2 text-sm"

export default function DealsPanel() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("open")
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [ms, setMs] = useState({ kind: "meeting", at: today(), note: "" })
  const [ext, setExt] = useState({ until: "", note: "" })

  async function load() {
    setLoading(true)
    try { const r = await fetch("/api/partner-deals"); const d = await r.json(); setDeals(d.deals || []) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function act(id: string, body: Record<string, unknown>, ok: string) {
    setBusy(true); setMsg(null)
    try {
      let r = await fetch(`/api/partner-deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      let d = await r.json()
      if (r.status === 409 && d.needsConfirm) {
        if (!window.confirm(`${d.error}\n\nCustomers and an employee's pipeline normally take precedence over a partner. Approve anyway? The override is recorded.`)) { setMsg({ ok: false, text: "Not approved." }); return }
        r = await fetch(`/api/partner-deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, force: true }) })
        d = await r.json()
      }
      if (!r.ok) { setMsg({ ok: false, text: d.error || "That did not save." }); return }
      setDeals((p) => p.map((x) => (x._id === id ? d.deal : x)))
      setMsg({ ok: true, text: ok })
    } catch { setMsg({ ok: false, text: "Network error." }) } finally { setBusy(false) }
  }

  const counts = useMemo(() => { const c: Record<string, number> = {}; deals.forEach((d) => { c[d.status] = (c[d.status] || 0) + 1 }); return c }, [deals])
  const visible = deals.filter((d) => filter === "all" ? true : filter === "open" ? ["pending", "active"].includes(d.status) : d.status === filter)
  const soon = (d: Deal) => d.status === "active" && d.validUntil && new Date(d.validUntil).getTime() - Date.now() < 14 * 864e5

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-[#e0e0e0] bg-white p-5">
        <div>
          <h2 className="text-xl font-semibold text-[#242424]">Deal registrations</h2>
          <p className="mt-1 max-w-[80ch] text-sm text-[#616161]">
            Prospects registered by partners. Approval holds a prospect for 90 days and locks the commission schedule version in force.
            Only milestones you record extend it (to 60 days after the milestone), up to 180 days from approval, unless you extend it in writing.
          </p>
        </div>
        <button type="button" className={btn} onClick={load}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[["open", "Open"], ["pending", "Awaiting approval"], ["active", "Registered"], ["lapsed", "Lapsed"], ["won", "Won"], ["lost", "Lost"], ["refused", "Refused"], ["all", "All"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className={`h-8 rounded-full border px-3 text-[13px] font-semibold ${filter === k ? "border-[#0b7e9b] bg-[#e8f7fb] text-[#0b7e9b]" : "border-[#e0e0e0] bg-white text-[#424242] hover:bg-[#f5f5f5]"}`}>
            {l} <span className="font-normal text-[#616161]">{k === "all" ? deals.length : k === "open" ? (counts.pending || 0) + (counts.active || 0) : counts[k] || 0}</span>
          </button>
        ))}
      </div>

      {msg && <div className={`rounded-[4px] px-3 py-2 text-sm font-semibold ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-[#c50f1f]"}`} role="status">{msg.text}</div>}

      <div className="overflow-hidden rounded-lg border border-[#e0e0e0] bg-white">
        {!loading && visible.length === 0 && <p className="px-4 py-6 text-sm text-[#616161]">Nothing here.</p>}
        {visible.map((d) => {
          const isOpen = open === d._id
          return (
            <div key={d._id} className="border-b border-[#f0f0f0] last:border-b-0">
              <button type="button" onClick={() => setOpen(isOpen ? null : d._id)} aria-expanded={isOpen}
                className="grid w-full grid-cols-1 gap-1 px-4 py-3 text-left hover:bg-[#fafafa] md:grid-cols-[130px_minmax(0,1.4fr)_minmax(0,1fr)_140px_130px_24px] md:items-center md:gap-3">
                <span className="font-mono text-xs text-[#424242]">{d.ref}</span>
                <span className="min-w-0"><span className="block truncate font-semibold text-[#242424]">{d.organisation}</span>
                  <span className="block truncate text-xs text-[#616161]">{d.lineOfBusiness || "Line not given"}{d.conflict ? <span className="ml-1 font-semibold text-[#c50f1f]">· {KIND[d.conflict.kind]}</span> : null}</span></span>
                <span className="min-w-0 truncate text-sm text-[#424242]">{d.partnerName} <span className="text-xs text-[#616161]">({d.partnerNumber})</span></span>
                <span><span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold ${TONE[d.status]}`}>{LABEL[d.status]}</span></span>
                <span className={`text-sm ${soon(d) ? "font-semibold text-amber-700" : "text-[#424242]"}`}>{d.status === "active" ? `to ${fmt(d.validUntil)}` : d.status === "pending" ? fmt(d.submittedAt) : fmt(d.closedAt || d.validUntil)}</span>
                <span className="hidden text-[#616161] md:block">{isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</span>
              </button>
              {isOpen && (
                <div className="space-y-3 bg-[#fafafa] px-4 pb-5 pt-2 text-sm">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
                      <p className="mb-1 font-semibold">Prospect</p>
                      <p>{d.organisation}{d.sector ? ` · ${d.sector}` : ""}</p>
                      <p className="text-[#424242]">{[d.contactName, d.contactRole, d.contactEmail, d.contactPhone].filter(Boolean).join(" · ") || "No contact given"}</p>
                      {d.requirement && <p className="mt-1 text-[#424242]">{d.requirement}</p>}
                      <p className="mt-1 text-[#616161]">{[d.estimatedValue ? `Estimated \u20a6${d.estimatedValue.toLocaleString("en-NG")}` : "", d.expectedClose ? `Timing ${d.expectedClose}` : "", d.source === "application" ? "From the partner's application" : ""].filter(Boolean).join(" · ")}</p>
                      {d.conflict && <p className="mt-1 font-semibold text-[#c50f1f]">{KIND[d.conflict.kind]}: {d.conflict.match}{d.conflict.owner ? ` (${d.conflict.owner})` : ""}</p>}
                    </div>
                    <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
                      <p className="mb-1 font-semibold">Registration</p>
                      <p>Submitted {fmtDT(d.submittedAt)}{d.approvedAt ? `; approved ${fmtDT(d.approvedAt)} by ${d.approvedBy}` : ""}</p>
                      {d.approvedAt && <p>Valid until <strong>{fmt(d.validUntil)}</strong>; limit {fmt(d.hardLimit)}; schedule version {d.scheduleVersion ?? "none"} locked</p>}
                      {d.decisionNote && <p className="text-[#424242]">Note: {d.decisionNote}</p>}
                      {d.closedAt && <p>Closed {fmtDT(d.closedAt)}{d.status === "won" ? (d.validAtClose ? " while valid: first-year commission applies" : " after lapse: no first-year commission") : ""}</p>}
                      {d.milestones.length > 0 && <ul className="mt-1 list-disc pl-5">{d.milestones.map((m, i) => <li key={i}>{MS[m.kind]} on {fmt(m.at)} ({m.by}){m.note ? `: ${m.note}` : ""}</li>)}</ul>}
                    </div>
                  </div>

                  {d.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={primary} disabled={busy} onClick={() => act(d._id, { action: "approve" }, "Approved. The partner has been emailed.")}><Check className="size-4" /> Approve</button>
                      <button type="button" className={btn} disabled={busy} onClick={() => { const n = window.prompt("Reason (the partner sees this):", d.conflict ? KIND[d.conflict.kind] : ""); if (n) act(d._id, { action: "refuse", note: n }, "Refused. The partner has been emailed.") }}><X className="size-4" /> Refuse</button>
                    </div>
                  )}

                  {d.status === "active" && (
                    <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
                      <p className="mb-2 flex items-center gap-1.5 font-semibold"><Flag className="size-4" /> Record a milestone GoLive confirms</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <select className={input} value={ms.kind} onChange={(e) => setMs({ ...ms, kind: e.target.value })}>
                          {Object.entries(MS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                        <input type="date" className={input} value={ms.at} max={today()} onChange={(e) => setMs({ ...ms, at: e.target.value })} />
                        <input className={`${input} min-w-[220px] flex-1`} placeholder="Note (optional)" value={ms.note} onChange={(e) => setMs({ ...ms, note: e.target.value })} />
                        <button type="button" className={primary} disabled={busy} onClick={() => act(d._id, { action: "milestone", ...ms }, "Milestone recorded.")}>Record</button>
                      </div>
                    </div>
                  )}

                  {["active", "lapsed"].includes(d.status) && (
                    <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
                      <p className="mb-2 flex items-center gap-1.5 font-semibold"><CalendarPlus className="size-4" /> Extend in writing{d.status === "lapsed" ? " (revives the registration)" : ""}</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <input type="date" className={input} min={today()} value={ext.until} onChange={(e) => setExt({ ...ext, until: e.target.value })} />
                        <input className={`${input} min-w-[260px] flex-1`} placeholder="Reason (required)" value={ext.note} onChange={(e) => setExt({ ...ext, note: e.target.value })} />
                        <button type="button" className={btn} disabled={busy || !ext.until || !ext.note} onClick={() => act(d._id, { action: "extend", ...ext }, "Extended.")}>Extend</button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className={primary} disabled={busy} onClick={() => { if (window.confirm(`Mark ${d.organisation} as won?${d.status === "lapsed" ? " It has lapsed, so no first-year commission applies." : ""}`)) act(d._id, { action: "won" }, "Marked as won.") }}><Trophy className="size-4" /> Won</button>
                        <button type="button" className={btn} disabled={busy} onClick={() => { const n = window.prompt("Why was it lost? (optional)", ""); if (n !== null) act(d._id, { action: "lost", note: n }, "Marked as lost.") }}><XCircle className="size-4" /> Lost</button>
                        <button type="button" className={btn} disabled={busy} onClick={() => { const n = window.prompt("Reason for releasing this registration:", ""); if (n) act(d._id, { action: "release", note: n }, "Released.") }}>Release</button>
                      </div>
                    </div>
                  )}

                  {d.status === "won" && <DealCommission dealId={d._id} lineOfBusiness={d.lineOfBusiness} validAtClose={d.validAtClose} whmcsClientId={d.whmcsClientId} whmcsLine={d.whmcsLine} onChanged={load} />}

                  <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
                    <p className="mb-1 font-semibold">Timeline</p>
                    <ol className="space-y-1">{[...d.timeline].reverse().map((t, i) => (
                      <li key={i} className="grid grid-cols-[170px_1fr] gap-3"><span className="text-[#616161]">{fmtDT(t.at)}</span><span>{t.action} <span className="text-[#616161]">· {t.by}</span>{t.note && <span className="block text-[#424242]">{t.note}</span>}</span></li>
                    ))}</ol>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
