"use client"
import { useEffect, useMemo, useState } from "react"
import { RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Copy, ExternalLink, ShieldCheck, Check, X, RotateCcw } from "lucide-react"
import { STAGE_LABELS, STAGE_ORDER, CATEGORY_INFO, DECLARATIONS, ACKNOWLEDGEMENTS } from "@/lib/partnerConfig"
import { MODULES, ASSESSMENT_RULES } from "@/lib/partnerTraining"

type Conflict = { kind: "customer" | "lead" | "partner"; match: string; owner?: string } | null
type Account = {
  _id: string; organisation: string; sector?: string; contactName?: string; contactRole?: string
  requirement?: string; timing?: string; conflict?: Conflict
  decision?: "pending" | "registered" | "refused"; decisionNote?: string; decidedAt?: string; decidedBy?: string
}
type Row = {
  _id: string; ref: string; status: string; category: "referral" | "sales"
  applicant: { name: string; email: string; phone: string; city?: string }
  namedAccounts: { decision?: string; conflict?: Conflict }[]
  declarations?: Record<string, boolean | string>
  partnerNumber?: string; createdAt: string
}
type Full = Omit<Row, "applicant" | "namedAccounts"> & {
  applicant: Record<string, string>
  background: { occupation?: string; yearsB2B?: string; sectors?: string; productsSold?: string; largestDeal?: string; referees?: { name: string; position?: string; phone?: string }[] }
  namedAccounts: Account[]
  solutions: string[]
  engagement: Record<string, string>
  acknowledgements: Record<string, boolean>
  signature: { name: string; signedAt: string; ip?: string; userAgent?: string }
  emailVerifiedAt?: string
  notes?: string
  timeline: { at: string; by: string; action: string; note?: string }[]
  training?: { invitedAt?: string; lastInviteAt?: string; modules?: { no: number; completedAt: string }[] }
  attempts?: {
    kind: "integrity" | "final"; number: number; startedAt: string; submittedAt?: string; abandoned?: boolean
    pct?: number; passed?: boolean; late?: boolean
    integrity?: { tabSwitches: number; focusLoss: number; pasteTries: number; copyTries: number; seconds: number }
  }[]
  extraFinalAttempts?: number
  assessmentPassedAt?: string
  agreement?: { version: string; test?: boolean; sentAt: string; scheduleVersion?: number; partnerSignedAt?: string; partnerSignedName?: string; partnerIp?: string; mdSignedAt?: string; mdSignedName?: string }
  certificate?: { number: string; title: string; issuedAt: string; expiresAt: string; test?: boolean; revokedAt?: string; revokedBy?: string; revokeReason?: string }
}
type AMode = { allowed: boolean; test: boolean; reason?: string }
type TState = {
  required: number[]; completed: Record<string, string>
  integrity: { passed: boolean; attempts: number }
  final: { passed: boolean; attempts: number; allowed: number; canBegin: boolean; reason?: string; availableFrom?: string }
}

const STAGE_TONE: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700 border-blue-200",
  screening: "bg-sky-50 text-sky-700 border-sky-200",
  interview: "bg-indigo-50 text-indigo-700 border-indigo-200",
  training: "bg-violet-50 text-violet-700 border-violet-200",
  assessment: "bg-amber-50 text-amber-700 border-amber-200",
  agreement: "bg-orange-50 text-orange-700 border-orange-200",
  active: "bg-green-50 text-green-700 border-green-200",
  declined: "bg-gray-100 text-gray-600 border-gray-300",
  withdrawn: "bg-gray-100 text-gray-600 border-gray-300",
}
const KIND_LABEL = { customer: "Existing customer", lead: "In sales pipeline", partner: "Registered to another partner" }
const JOINT: Record<string, string> = { none: "Not needed", corporate: "Corporate meetings", technical: "Technical meetings", both: "Corporate and technical" }

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "\u2014")
const fmtDT = (d?: string) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }) + " WAT" : "\u2014"
const yesCount = (d?: Record<string, boolean | string>) => DECLARATIONS.filter((x) => d?.[x.key] === true).length

function Badge({ status }: { status: string }) {
  return <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold ${STAGE_TONE[status] || STAGE_TONE.applied}`}>{STAGE_LABELS[status] || status}</span>
}

function KV({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-3 py-1.5 text-sm">
      <span className="text-[#616161]">{k}</span>
      <span className="whitespace-pre-wrap break-words text-[#242424]">{v && String(v).trim() ? v : "\u2014"}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#e0e0e0] bg-white p-4">
      <h4 className="mb-2 text-sm font-semibold text-[#242424]">{title}</h4>
      {children}
    </section>
  )
}

export default function PartnersPanel() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("open")
  const [open, setOpen] = useState<string | null>(null)
  const [detail, setDetail] = useState<Full | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [nextStage, setNextStage] = useState("")
  const [stageNote, setStageNote] = useState("")
  const [notes, setNotes] = useState("")
  const [copied, setCopied] = useState(false)
  const [tstate, setTstate] = useState<TState | null>(null)
  const [amode, setAmode] = useState<AMode | null>(null)
  const [curVer, setCurVer] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/partners")
      const d = await r.json()
      setRows(d.applications || [])
    } catch { setRows([]) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1 })
    return c
  }, [rows])
  const visible = rows.filter((r) =>
    filter === "all" ? true : filter === "open" ? !["declined", "withdrawn", "active"].includes(r.status) : r.status === filter)

  function adopt(app: Full) {
    setDetail(app)
    setNotes(app.notes || "")
    const idx = STAGE_ORDER.indexOf(app.status as (typeof STAGE_ORDER)[number])
    setNextStage(idx >= 0 && idx < STAGE_ORDER.length - 2 ? STAGE_ORDER[idx + 1] : "")
    setStageNote("")
    setRows((prev) => prev.map((r) => (r._id === app._id ? { ...r, status: app.status, namedAccounts: app.namedAccounts, partnerNumber: app.partnerNumber } : r)))
  }

  async function toggle(id: string) {
    if (open === id) { setOpen(null); setDetail(null); return }
    setOpen(id); setDetail(null); setMsg(null)
    try {
      const r = await fetch(`/api/partners/${id}`)
      const d = await r.json()
      if (d.application) { adopt(d.application); setTstate(d.training || null); setAmode(d.agreementMode || null); setCurVer(d.currentScheduleVersion ?? null) }
    } catch { setMsg({ ok: false, text: "Could not load the application." }) }
  }

  async function act(body: Record<string, unknown>, success: string) {
    if (!detail) return
    setBusy(true); setMsg(null)
    try {
      let r = await fetch(`/api/partners/${detail._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      let d = await r.json()
      if (r.status === 409 && d.needsConfirm) {
        const ok = window.confirm(`${d.error}\n\nCustomers and an employee's pipeline normally take precedence over a partner. Register it to this partner anyway? The override is recorded on the timeline.`)
        if (!ok) { setMsg({ ok: false, text: "Not registered." }); return }
        r = await fetch(`/api/partners/${detail._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, force: true }) })
        d = await r.json()
      }
      if (!r.ok) { setMsg({ ok: false, text: d.error || "That did not save." }); return }
      adopt(d.application)
      if (d.training) setTstate(d.training)
      if (d.agreementMode) setAmode(d.agreementMode)
      if (d.currentScheduleVersion !== undefined) setCurVer(d.currentScheduleVersion)
      setMsg({ ok: true, text: success })
    } catch { setMsg({ ok: false, text: "Network error." }) } finally { setBusy(false) }
  }

  function decide(acc: Account, decision: "registered" | "refused" | "pending") {
    let note = ""
    if (decision === "refused") {
      const n = window.prompt(`Reason for refusing ${acc.organisation} (shown on the record):`, acc.conflict ? KIND_LABEL[acc.conflict.kind] : "")
      if (n === null) return
      note = n
    }
    act({ action: "account", accountId: acc._id, decision, note },
      decision === "registered" ? `${acc.organisation} registered to this applicant.` : decision === "refused" ? `${acc.organisation} refused.` : `${acc.organisation} reset to pending.`)
  }

  const applyUrl = "https://cloud.golivecompany.com/partners/apply"
  async function copyLink() {
    try { await navigator.clipboard.writeText(applyUrl); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* clipboard blocked */ }
  }

  const filters: [string, string][] = [
    ["open", "In progress"], ["all", "All"], ...STAGE_ORDER.map((s) => [s, STAGE_LABELS[s]] as [string, string]),
    ["declined", "Declined"], ["withdrawn", "Withdrawn"],
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-[#e0e0e0] bg-white p-5">
        <div>
          <h2 className="text-xl font-semibold text-[#242424]">Partner applications</h2>
          <p className="mt-1 max-w-[70ch] text-sm text-[#616161]">
            GoLive Partner Network applications from the public form. Review each applicant, decide their named accounts,
            and move them through accreditation. Every action is recorded on the applicant&rsquo;s timeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyLink} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d1d1d1] bg-white px-3 text-sm font-semibold text-[#242424] hover:bg-[#f5f5f5]">
            {copied ? <Check className="size-4 text-green-700" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy application link"}
          </button>
          <a href="/partners" target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d1d1d1] bg-white px-3 text-sm font-semibold text-[#242424] hover:bg-[#f5f5f5]">
            <ExternalLink className="size-4" /> Public page
          </a>
          <button type="button" onClick={load} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d1d1d1] bg-white px-3 text-sm font-semibold text-[#242424] hover:bg-[#f5f5f5]">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by stage">
        {filters.map(([k, label]) => {
          const n = k === "all" ? rows.length : k === "open" ? rows.filter((r) => !["declined", "withdrawn", "active"].includes(r.status)).length : counts[k] || 0
          return (
            <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={`h-8 rounded-full border px-3 text-[13px] font-semibold ${filter === k ? "border-[#0b7e9b] bg-[#e8f7fb] text-[#0b7e9b]" : "border-[#e0e0e0] bg-white text-[#424242] hover:bg-[#f5f5f5]"}`}>
              {label} <span className="font-normal text-[#616161]">{n}</span>
            </button>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e0e0e0] bg-white">
        <div className="hidden grid-cols-[150px_minmax(0,1.6fr)_130px_130px_120px_110px_28px] gap-3 border-b border-[#e0e0e0] px-4 py-2.5 text-xs font-semibold text-[#616161] md:grid">
          <span>Reference</span><span>Applicant</span><span>Category</span><span>Stage</span><span>Accounts</span><span>Applied</span><span />
        </div>
        {loading && <p className="px-4 py-6 text-sm text-[#616161]">Loading applications…</p>}
        {!loading && visible.length === 0 && (
          <p className="px-4 py-6 text-sm text-[#616161]">
            No applications here yet. Share the application link ({applyUrl}) with prospective partners.
          </p>
        )}
        {visible.map((r) => {
          const conflicts = r.namedAccounts.filter((a) => a.conflict).length
          const yes = yesCount(r.declarations)
          const isOpen = open === r._id
          return (
            <div key={r._id} className="border-b border-[#f0f0f0] last:border-b-0">
              <button type="button" onClick={() => toggle(r._id)} aria-expanded={isOpen}
                className="grid w-full grid-cols-1 gap-1 px-4 py-3 text-left hover:bg-[#fafafa] md:grid-cols-[150px_minmax(0,1.6fr)_130px_130px_120px_110px_28px] md:items-center md:gap-3">
                <span className="font-mono text-xs text-[#424242]">{r.ref}{r.partnerNumber && <><br />{r.partnerNumber}</>}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[#242424]">{r.applicant.name}</span>
                  <span className="block truncate text-xs text-[#616161]">{r.applicant.email}{r.applicant.city ? ` \u00b7 ${r.applicant.city}` : ""}</span>
                </span>
                <span className="text-sm text-[#424242]">{CATEGORY_INFO[r.category]?.label}</span>
                <span><Badge status={r.status} /></span>
                <span className="text-sm text-[#424242]">
                  {r.namedAccounts.length}
                  {conflicts > 0 && <span className="ml-1.5 font-semibold text-[#c50f1f]">{conflicts} conflict{conflicts === 1 ? "" : "s"}</span>}
                  {yes > 0 && <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-amber-700"><AlertTriangle className="size-3" />{yes}</span>}
                </span>
                <span className="text-sm text-[#424242]">{fmt(r.createdAt)}</span>
                <span className="hidden text-[#616161] md:block">{isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</span>
              </button>

              {isOpen && (
                <div className="space-y-3 bg-[#fafafa] px-4 pb-5 pt-2">
                  {!detail && <p className="text-sm text-[#616161]">Loading…</p>}
                  {detail && detail._id === r._id && (
                    <>
                      {msg && (
                        <div className={`rounded-[4px] px-3 py-2 text-sm font-semibold ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-[#c50f1f]"}`} role="status">{msg.text}</div>
                      )}

                      <Section title="Accreditation stage">
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="mr-2"><span className="block text-xs text-[#616161]">Current</span><Badge status={detail.status} /></div>
                          <label className="flex flex-col text-xs font-semibold text-[#424242]">Move to
                            <select value={nextStage} onChange={(e) => setNextStage(e.target.value)} className="mt-1 h-8 rounded-[4px] border border-[#d1d1d1] bg-white px-2 text-sm font-normal">
                              <option value="">Choose a stage</option>
                              {STAGE_ORDER.filter((s) => s !== "active" && s !== detail.status).map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                              <option value="declined">Declined</option>
                              <option value="withdrawn">Withdrawn</option>
                            </select>
                          </label>
                          <label className="flex min-w-[240px] flex-1 flex-col text-xs font-semibold text-[#424242]">Note for the timeline (optional)
                            <input value={stageNote} onChange={(e) => setStageNote(e.target.value)} className="mt-1 h-8 rounded-[4px] border border-[#d1d1d1] bg-white px-2 text-sm font-normal" />
                          </label>
                          <button type="button" disabled={busy || !nextStage}
                            onClick={() => act({ action: "stage", status: nextStage, note: stageNote }, `Moved to ${STAGE_LABELS[nextStage]}.`)}
                            className="h-8 rounded-[4px] bg-[#0f8fb0] px-4 text-sm font-semibold text-white hover:bg-[#0b7e9b] disabled:opacity-50">Move</button>
                        </div>
                        <p className="mt-2 text-xs text-[#616161]">
                          Moving an applicant to Training emails them their personal training link. Passing the partner assessment moves them to Agreement automatically. Active status, the GL-PTR number and the certificate are issued when you countersign the partner agreement.
                        </p>
                      </Section>

                      {(detail.training?.invitedAt || ["training", "assessment", "agreement", "active"].includes(detail.status)) && (
                        <Section title="Training and assessment">
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#424242]">
                            <span>{detail.training?.invitedAt ? `Training link first sent ${fmtDT(detail.training.invitedAt)}${detail.training.lastInviteAt && detail.training.lastInviteAt !== detail.training.invitedAt ? `, last sent ${fmtDT(detail.training.lastInviteAt)}` : ""}.` : "Training link not sent yet."}</span>
                            <button type="button" disabled={busy} onClick={() => act({ action: "sendTraining" }, `Training link emailed to ${detail.applicant.email}.`)}
                              className="inline-flex h-7 items-center rounded-[4px] border border-[#d1d1d1] bg-white px-2.5 text-xs font-semibold text-[#242424] hover:bg-[#f5f5f5] disabled:opacity-50">
                              {detail.training?.invitedAt ? "Resend training link" : "Send training link"}
                            </button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {MODULES.filter((m) => !tstate || tstate.required.includes(m.no)).map((m) => {
                              const done = detail.training?.modules?.find((x) => x.no === m.no)
                              return (
                                <div key={m.no} className={`rounded-[4px] border p-2.5 text-xs ${done ? "border-green-200 bg-green-50" : "border-[#e0e0e0] bg-white"}`}>
                                  <p className="font-semibold text-[#242424]">Module {m.no}: {m.title}</p>
                                  <p className={done ? "text-green-700" : "text-[#616161]"}>{done ? `Completed ${fmtDT(done.completedAt)}` : "Not completed"}</p>
                                </div>
                              )
                            })}
                          </div>
                          {(detail.attempts || []).length > 0 && (
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="text-[#616161]">
                                  <tr><th className="py-1.5 pr-3 font-semibold">Assessment</th><th className="pr-3 font-semibold">Attempt</th><th className="pr-3 font-semibold">Submitted</th><th className="pr-3 font-semibold">Score</th><th className="pr-3 font-semibold">Result</th><th className="font-semibold">Integrity log</th></tr>
                                </thead>
                                <tbody>
                                  {(detail.attempts || []).map((a, i) => (
                                    <tr key={i} className="border-t border-[#f0f0f0] text-[#242424]">
                                      <td className="py-1.5 pr-3">{ASSESSMENT_RULES[a.kind].title}</td>
                                      <td className="pr-3">{a.number}</td>
                                      <td className="pr-3">{a.submittedAt ? fmtDT(a.submittedAt) : `In progress since ${fmtDT(a.startedAt)}`}</td>
                                      <td className="pr-3">{a.submittedAt ? `${a.pct ?? 0}%` : "\u2014"}</td>
                                      <td className="pr-3">
                                        {!a.submittedAt ? "\u2014" : a.abandoned ? <span className="font-semibold text-[#c50f1f]">Time ran out</span>
                                          : a.passed ? <span className="font-semibold text-green-700">Passed</span>
                                          : <span className="font-semibold text-[#c50f1f]">Not passed{a.late ? " (late)" : ""}</span>}
                                      </td>
                                      <td className={`${a.integrity && (a.integrity.tabSwitches + a.integrity.focusLoss + a.integrity.pasteTries + a.integrity.copyTries) > 3 ? "font-semibold text-amber-700" : "text-[#424242]"}`}>
                                        {a.integrity ? `${a.integrity.tabSwitches} tab, ${a.integrity.focusLoss} focus, ${a.integrity.pasteTries + a.integrity.copyTries} copy/paste, ${Math.round(a.integrity.seconds / 60)} min` : "\u2014"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {tstate && !tstate.final.passed && tstate.final.attempts > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#424242]">
                              <span>
                                Partner assessment: {tstate.final.attempts} of {tstate.final.allowed} attempts used.
                                {tstate.final.availableFrom ? ` Next attempt opens ${fmt(tstate.final.availableFrom)}.` : tstate.final.canBegin ? " Next attempt available now." : ""}
                              </span>
                              <button type="button" disabled={busy}
                                onClick={() => { const n = window.prompt("Reason for granting an extra attempt (recorded on the timeline):", ""); if (n !== null) act({ action: "grantAttempt", note: n }, "Extra attempt granted; available now.") }}
                                className="inline-flex h-7 items-center rounded-[4px] border border-[#d1d1d1] bg-white px-2.5 font-semibold text-[#242424] hover:bg-[#f5f5f5] disabled:opacity-50">
                                Grant an extra attempt now
                              </button>
                            </div>
                          )}
                        </Section>
                      )}

                      {(detail.assessmentPassedAt || detail.agreement?.sentAt || detail.certificate?.number) && (() => {
                        const ag = detail.agreement
                        const c = detail.certificate
                        const expired = c && !c.revokedAt && new Date(c.expiresAt).getTime() < Date.now()
                        const btn = "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d1d1d1] bg-white px-3 text-sm font-semibold text-[#242424] hover:bg-[#f5f5f5] disabled:opacity-50"
                        const primary = "inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#0f8fb0] px-4 text-sm font-semibold text-white hover:bg-[#0b7e9b] disabled:opacity-50"
                        return (
                          <Section title="Agreement and certificate">
                            <div className="space-y-1.5 text-sm text-[#242424]">
                              <p>
                                <span className="text-[#616161]">Agreement: </span>
                                {!ag ? "Not sent yet." : <>
                                  {ag.test && <span className="mr-1.5 rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-[#c50f1f]">TEST</span>}
                                  {ag.version}{ag.scheduleVersion ? `, commission schedule version ${ag.scheduleVersion}` : ""}, sent {fmtDT(ag.sentAt)}.
                                  {ag.partnerSignedAt ? ` Signed by the partner as \u201c${ag.partnerSignedName}\u201d ${fmtDT(ag.partnerSignedAt)}${ag.partnerIp ? ` (IP ${ag.partnerIp})` : ""}.` : " Awaiting the partner\u2019s signature."}
                                  {ag.mdSignedAt ? ` Countersigned by ${ag.mdSignedName} ${fmtDT(ag.mdSignedAt)}.` : ""}
                                </>}
                              </p>
                              {detail.partnerNumber && <p><span className="text-[#616161]">Partner number: </span><strong className="font-mono">{detail.partnerNumber}</strong></p>}
                              {c && (
                                <p>
                                  <span className="text-[#616161]">Certificate: </span><strong className="font-mono">{c.number}</strong>, {c.title}, issued {fmt(c.issuedAt)}, valid until {fmt(c.expiresAt)}.{" "}
                                  {c.revokedAt ? <span className="font-semibold text-[#c50f1f]">Revoked {fmtDT(c.revokedAt)}: {c.revokeReason}</span>
                                    : expired ? <span className="font-semibold text-[#c50f1f]">Expired.</span>
                                    : <span className="font-semibold text-green-700">Valid.</span>}
                                </p>
                              )}
                            </div>
                            {ag && !ag.partnerSignedAt && curVer && ag.scheduleVersion !== curVer && (
                              <p className="mt-2 rounded-[4px] bg-amber-50 p-2 text-xs font-semibold text-amber-800">
                                This agreement carries {ag.scheduleVersion ? `commission schedule version ${ag.scheduleVersion}` : "no published schedule"}, but version {curVer} is now in force. Resend it before the partner signs, so they sign the current rates.
                              </p>
                            )}
                            {!ag?.mdSignedAt && amode && !amode.allowed && (
                              <p className="mt-2 rounded-[4px] bg-amber-50 p-2 text-xs text-amber-800">{amode.reason}</p>
                            )}
                            {!ag?.mdSignedAt && amode?.test && (
                              <p className="mt-2 rounded-[4px] bg-red-50 p-2 text-xs font-semibold text-[#c50f1f]">Rates not yet confirmed: this applicant is on the test list, so they receive a TEST agreement and test numbers.</p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <a className={btn} href={`/api/partner-agreement/pdf?id=${detail._id}`}>{ag?.mdSignedAt ? "Signed agreement (PDF)" : "Preview agreement (PDF)"}</a>
                              {!ag?.partnerSignedAt && (
                                <button type="button" className={ag ? btn : primary} disabled={busy || !detail.assessmentPassedAt || !amode?.allowed}
                                  onClick={() => act({ action: "sendAgreement" }, `Agreement emailed to ${detail.applicant.email}.`)}>
                                  {ag ? "Resend agreement" : "Send agreement to sign"}
                                </button>
                              )}
                              {ag?.partnerSignedAt && !ag.mdSignedAt && (
                                <button type="button" className={primary} disabled={busy}
                                  onClick={() => { if (window.confirm(`Countersign ${detail.applicant.name}'s agreement?\n\nThis executes it, issues their partner number and certificate, makes them an Active partner, and emails them both documents.`)) act({ action: "countersign" }, "Countersigned. Partner number and certificate issued and emailed.") }}>
                                  Countersign and issue certificate
                                </button>
                              )}
                              {c && (
                                <>
                                  <a className={btn} href={`/api/partner-certificate/pdf?id=${detail._id}`}>Certificate (PDF)</a>
                                  <a className={btn} href={`/verify/${encodeURIComponent(c.number)}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Verification page</a>
                                  {!c.revokedAt && <button type="button" className={btn} disabled={busy} onClick={() => act({ action: "resendDocuments" }, "Documents re-sent.")}>Resend documents</button>}
                                  {!c.revokedAt && (
                                    <button type="button" className={`${btn} border-red-300 text-[#c50f1f] hover:bg-red-50`} disabled={busy}
                                      onClick={() => { const n = window.prompt("Reason for revoking this certificate (kept on the record, never shown publicly):", ""); if (n) act({ action: "revokeCertificate", note: n }, "Certificate revoked. The verification page now shows it as revoked.") }}>
                                      Revoke certificate
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </Section>
                        )
                      })()}

                      <div className="grid gap-3 lg:grid-cols-2">
                        <Section title="Applicant">
                          <KV k="Category" v={CATEGORY_INFO[detail.category]?.label} />
                          <KV k="Name" v={detail.applicant.name} />
                          <KV k="Preferred name" v={detail.applicant.preferredName} />
                          <KV k="Email" v={`${detail.applicant.email}${detail.emailVerifiedAt ? " (verified)" : ""}`} />
                          <KV k="Mobile" v={detail.applicant.phone} />
                          <KV k="LinkedIn" v={detail.applicant.linkedin} />
                          <KV k="Location" v={[detail.applicant.city, detail.applicant.state].filter(Boolean).join(", ")} />
                          <KV k="Applying as" v={detail.applicant.applyingAs === "business" ? `Business: ${detail.applicant.businessName || ""}` : "Individual"} />
                          {detail.applicant.applyingAs === "business" && <KV k="CAC number" v={detail.applicant.cacNumber} />}
                          <KV k="TIN" v={detail.applicant.tin || "Not given (required before any commission is paid)"} />
                        </Section>
                        <Section title="Background">
                          <KV k="Occupation" v={detail.background.occupation} />
                          <KV k="B2B selling" v={detail.background.yearsB2B} />
                          <KV k="Sectors" v={detail.background.sectors} />
                          <KV k="Sold before" v={detail.background.productsSold} />
                          <KV k="Largest deal" v={detail.background.largestDeal} />
                          {(detail.background.referees || []).map((rf, i) => (
                            <KV key={i} k={`Referee ${i + 1}`} v={[rf.name, rf.position, rf.phone].filter(Boolean).join(", ")} />
                          ))}
                        </Section>
                      </div>

                      <Section title={`Named accounts (${detail.namedAccounts.length})`}>
                        {detail.namedAccounts.length === 0 && <p className="text-sm text-[#616161]">None listed.</p>}
                        <div className="space-y-2">
                          {detail.namedAccounts.map((a) => (
                            <div key={a._id} className={`rounded-[4px] border p-3 ${a.conflict ? "border-red-200 bg-red-50/40" : "border-[#e0e0e0] bg-white"}`}>
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#242424]">{a.organisation}{a.sector && <span className="font-normal text-[#616161]"> · {a.sector}</span>}</p>
                                  <p className="text-xs text-[#424242]">
                                    {[a.contactName && `${a.contactName}${a.contactRole ? ` (${a.contactRole})` : ""}`, a.requirement, a.timing].filter(Boolean).join(" \u00b7 ") || "No further detail"}
                                  </p>
                                  {a.conflict && (
                                    <p className="mt-1 text-xs font-semibold text-[#c50f1f]">
                                      {KIND_LABEL[a.conflict.kind]}: {a.conflict.match}{a.conflict.owner ? ` (${a.conflict.owner})` : ""}
                                    </p>
                                  )}
                                  {a.decision && a.decision !== "pending" && (
                                    <p className="mt-1 text-xs text-[#616161]">
                                      {a.decision === "registered" ? "Registered" : "Refused"} {fmtDT(a.decidedAt)} by {a.decidedBy}{a.decisionNote ? `: ${a.decisionNote}` : ""}
                                    </p>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  {a.decision === "pending" || !a.decision ? (
                                    <>
                                      <button type="button" disabled={busy} onClick={() => decide(a, "registered")}
                                        className="inline-flex h-7 items-center gap-1 rounded-[4px] border border-green-300 bg-white px-2.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50">
                                        <Check className="size-3.5" /> Register
                                      </button>
                                      <button type="button" disabled={busy} onClick={() => decide(a, "refused")}
                                        className="inline-flex h-7 items-center gap-1 rounded-[4px] border border-red-300 bg-white px-2.5 text-xs font-semibold text-[#c50f1f] hover:bg-red-50 disabled:opacity-50">
                                        <X className="size-3.5" /> Refuse
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className={`inline-flex h-6 items-center rounded-full border px-2 text-xs font-semibold ${a.decision === "registered" ? "border-green-200 bg-green-50 text-green-700" : "border-gray-300 bg-gray-100 text-gray-600"}`}>
                                        {a.decision === "registered" ? "Registered" : "Refused"}
                                      </span>
                                      <button type="button" disabled={busy} onClick={() => decide(a, "pending")} title="Reset to pending"
                                        className="inline-flex size-7 items-center justify-center rounded-[4px] text-[#616161] hover:bg-[#f0f0f0] disabled:opacity-50">
                                        <RotateCcw className="size-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {detail.namedAccounts.length > 0 && (
                          <button type="button" disabled={busy} onClick={() => act({ action: "recheck" }, "Conflict check re-run against current customers, pipeline and registrations.")}
                            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d1d1d1] bg-white px-3 text-sm font-semibold text-[#242424] hover:bg-[#f5f5f5] disabled:opacity-50">
                            <RefreshCw className="size-4" /> Re-run conflict check
                          </button>
                        )}
                        <p className="mt-2 text-xs text-[#616161]">
                          Customers and accounts in an employee&rsquo;s pipeline take precedence over a partner&rsquo;s claim. Registration is re-checked at the moment you register.
                        </p>
                      </Section>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <Section title="Solutions and engagement">
                          <ul className="mb-2 list-disc pl-5 text-sm text-[#242424]">{detail.solutions.map((s) => <li key={s}>{s}</li>)}</ul>
                          <KV k="Joint meetings" v={JOINT[detail.engagement.jointMeetings] || detail.engagement.jointMeetings} />
                          <KV k="Hours per week" v={detail.engagement.hoursPerWeek} />
                          <KV k="First introduction" v={detail.engagement.firstIntroduction} />
                          <KV k="First closed sale" v={detail.engagement.firstSale} />
                          <KV k="Support needed" v={detail.engagement.supportNeeded} />
                        </Section>
                        <Section title="Declarations">
                          {DECLARATIONS.map((d) => {
                            const yes = (detail.declarations as Record<string, unknown> | undefined)?.[d.key] === true
                            return (
                              <div key={d.key} className="flex items-start justify-between gap-3 border-b border-[#f0f0f0] py-1.5 text-sm last:border-b-0">
                                <span className="text-[#424242]">{d.text}</span>
                                <span className={`shrink-0 font-semibold ${yes ? "text-amber-700" : "text-[#616161]"}`}>{yes ? "Yes" : "No"}</span>
                              </div>
                            )
                          })}
                          {typeof detail.declarations?.particulars === "string" && detail.declarations.particulars.trim() && (
                            <p className="mt-2 whitespace-pre-wrap rounded-[4px] bg-amber-50 p-2 text-sm text-[#242424]">{String(detail.declarations.particulars)}</p>
                          )}
                        </Section>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <Section title="Signature record">
                          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-green-700"><ShieldCheck className="size-4" /> All {ACKNOWLEDGEMENTS.length} acknowledgements confirmed</p>
                          <KV k="Signed as" v={detail.signature?.name} />
                          <KV k="Signed at" v={fmtDT(detail.signature?.signedAt)} />
                          <KV k="Email verified" v={fmtDT(detail.emailVerifiedAt)} />
                          <KV k="IP address" v={detail.signature?.ip} />
                        </Section>
                        <Section title="Managing Director notes (private)">
                          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6}
                            className="w-full rounded-[4px] border border-[#d1d1d1] bg-white p-2 text-sm" placeholder="Interview notes, referee checks, follow-ups" />
                          <button type="button" disabled={busy} onClick={() => act({ action: "notes", notes }, "Notes saved.")}
                            className="mt-2 h-8 rounded-[4px] bg-[#0f8fb0] px-4 text-sm font-semibold text-white hover:bg-[#0b7e9b] disabled:opacity-50">Save notes</button>
                        </Section>
                      </div>

                      <Section title="Delete record">
                        <p className="mb-2 text-xs text-[#616161]">For test records only. Permanently removes this application and its deal registrations, and frees its partner and certificate numbers. Unpaid commission lines go with it; refused once any commission has been paid to the partner. Withdraw a real partner instead.</p>
                        <button type="button" disabled={busy}
                          className="inline-flex h-8 items-center rounded-[4px] border border-red-300 bg-white px-3 text-sm font-semibold text-[#c50f1f] hover:bg-red-50 disabled:opacity-50"
                          onClick={async () => {
                            const typed = window.prompt(`This cannot be undone. Type ${detail.ref} to delete ${detail.applicant.name}'s record:`, "")
                            if (!typed) return
                            setBusy(true); setMsg(null)
                            try {
                              const r = await fetch(`/api/partners/${detail._id}?confirm=${encodeURIComponent(typed)}`, { method: "DELETE" })
                              const d = await r.json()
                              if (!r.ok) { setMsg({ ok: false, text: d.error || "Not deleted." }); return }
                              setRows((p) => p.filter((x) => x._id !== detail._id)); setOpen(null); setDetail(null)
                            } catch { setMsg({ ok: false, text: "Network error." }) } finally { setBusy(false) }
                          }}>Delete record</button>
                      </Section>

                      <Section title="Timeline">
                        <ol className="space-y-1.5">
                          {[...detail.timeline].reverse().map((t, i) => (
                            <li key={i} className="grid grid-cols-[170px_1fr] gap-3 text-sm">
                              <span className="text-[#616161]">{fmtDT(t.at)}</span>
                              <span className="text-[#242424]">{t.action} <span className="text-[#616161]">· {t.by}</span>{t.note && <span className="block text-[#424242]">{t.note}</span>}</span>
                            </li>
                          ))}
                        </ol>
                      </Section>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
