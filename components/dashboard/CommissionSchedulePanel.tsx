"use client"
import { useEffect, useState } from "react"
import { Plus, Trash2, Send, RefreshCw, History, AlertTriangle, Calculator, Lock } from "lucide-react"

type Row = { line: string; basis: string; referral: string; sales: string }
type Change = { kind: "added" | "removed" | "changed"; line: string; basis: string; field?: "referral" | "sales"; from?: string; to?: string }
type Version = { _id: string; version?: number; rows: Row[]; summary?: string; changes: Change[]; effectiveAt?: string; publishedBy?: string; notified?: { sent: number; failed: number } }
type Explain = { line: string; basis: string; auto: boolean; source: string; margin: number | null; sales: string; referral: string; below?: { title: string; margin: number }[] }
type Settings = { salesShare: number; referralShare: number; renewalFactor: number; odooLevel: "none" | "ready" | "silver" | "gold"; updatedAt?: string; updatedBy?: string }
type Margins = { batch: string | null; families: Record<string, { basis: number | null; min: number | null; products: number; lowest?: string; below: { title: string; margin: number }[]; zero: string[] }> }
type State = {
  current: Version | null; draft: Version | null; draftChanges: Change[]; draftProblems: string[]; history: Version[]
  settings: Settings; margins: Margins; explain: Explain[]; autoKeys: string[]; guardrails: string[]
}
const rk = (r: { line: string; basis: string }) => `${r.line.trim().toLowerCase()}|${r.basis.trim().toLowerCase()}`
const pct = (x: number | null) => (x === null ? "\u2014" : `${Math.round(x * 1000) / 10}%`)

const fmtDT = (d?: string) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }) + " WAT" : "\u2014"
const btn = "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d1d1d1] bg-white px-3 text-sm font-semibold text-[#242424] hover:bg-[#f5f5f5] disabled:opacity-50"
const primary = "inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#0f8fb0] px-4 text-sm font-semibold text-white hover:bg-[#0b7e9b] disabled:opacity-50"
const input = "h-8 w-full rounded-[4px] border border-[#d1d1d1] bg-white px-2 text-sm"
const area = "min-h-8 w-full resize-y rounded-[4px] border border-[#d1d1d1] bg-white px-2 py-1 text-sm leading-5"

function describe(c: Change): string {
  if (c.kind === "added") return `Added: ${c.line} (${c.basis})`
  if (c.kind === "removed") return `Removed: ${c.line} (${c.basis})`
  return `${c.line} (${c.basis}), ${c.field === "sales" ? "Sales" : "Referral"} Partners: ${c.from} \u2192 ${c.to}`
}

function RatesTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-[#616161]">
          <tr><th className="py-2 pr-3 font-semibold">Line of business</th><th className="pr-3 font-semibold">Basis</th><th className="pr-3 font-semibold">Referral Partner</th><th className="font-semibold">Sales Partner</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[#f0f0f0] align-top text-[#242424]">
              <td className="py-2 pr-3 font-semibold">{r.line}</td><td className="pr-3 text-[#424242]">{r.basis}</td><td className="pr-3">{r.referral}</td><td>{r.sales}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CommissionSchedulePanel() {
  const [st, setSt] = useState<State | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState("")
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string; list?: string[] } | null>(null)
  const [openV, setOpenV] = useState<number | null>(null)
  const [sf, setSf] = useState({ sales: "25", referral: "12.5", renewal: "50", odoo: "none" as Settings["odooLevel"] })
  const [sfDirty, setSfDirty] = useState(false)

  function adopt(s: State) {
    setSt(s)
    {
      setSf({ sales: String(Math.round(s.settings.salesShare * 1000) / 10), referral: String(Math.round(s.settings.referralShare * 1000) / 10), renewal: String(Math.round(s.settings.renewalFactor * 1000) / 10), odoo: s.settings.odooLevel })
      setSfDirty(false)
    }
    setRows(s.draft ? s.draft.rows.map((r) => ({ ...r })) : [])
    setSummary(s.draft?.summary || "")
    setDirty(false)
  }
  async function call(method: string, url: string, body?: unknown) {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
      const d = await r.json()
      if (!r.ok) { setMsg({ ok: false, text: d.error || "That did not work.", list: d.problems }); return null }
      return d
    } catch { setMsg({ ok: false, text: "Network error." }); return null } finally { setBusy(false) }
  }
  async function load() { const d = await call("GET", "/api/partner-commission"); if (d) adopt(d) }
  useEffect(() => { load() }, [])

  const setCell = (i: number, k: keyof Row, v: string) => { setRows((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r))); setDirty(true) }

  async function save() {
    const d = await call("PUT", "/api/partner-commission", { rows, summary })
    if (d) { adopt(d); setMsg({ ok: true, text: "Draft saved. Check the changes below before publishing." }) }
  }
  async function saveSettings() {
    const n = (v: string) => parseFloat(v) / 100
    const d = await call("PUT", "/api/partner-commission/settings", { salesShare: n(sf.sales), referralShare: n(sf.referral), renewalFactor: n(sf.renewal), odooLevel: sf.odoo })
    if (d) { await load(); setMsg({ ok: true, text: `Settings saved. ${d.message}` }) }
  }
  async function recalc() {
    const d = await call("POST", "/api/partner-commission/recalculate")
    if (d) { await load(); setMsg({ ok: true, text: d.message }) }
  }

  async function publish() {
    if (!st?.draft) return
    const next = (st.current?.version || 0) + 1
    const n = st.draftChanges.length
    if (!window.confirm(`Publish version ${next}?\n\n${n} change${n === 1 ? "" : "s"}. It takes effect immediately for every prospect registered from now on, and every active partner is emailed what changed. Published versions cannot be edited or deleted.`)) return
    const d = await call("POST", "/api/partner-commission/publish")
    if (d) {
      await load()
      const extra = d.pendingAgreements ? ` ${d.pendingAgreements} agreement${d.pendingAgreements === 1 ? " is" : "s are"} waiting for a signature on an older version; resend ${d.pendingAgreements === 1 ? "it" : "them"} from the partner's record to update the rates.` : ""
      setMsg({ ok: true, text: `Version ${d.version} published.${st.current ? ` ${d.notified?.sent || 0} partner${d.notified?.sent === 1 ? "" : "s"} emailed${d.notified?.failed ? `, ${d.notified.failed} failed (see their timelines)` : ""}.` : " This is the first version, so there were no partners to notify."}${extra}` })
    }
  }

  if (!st) return <div className="rounded-lg border border-[#e0e0e0] bg-white p-5 text-sm text-[#616161]">Loading…</div>

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#e0e0e0] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#242424]">Commission schedule</h2>
            <p className="mt-1 text-sm text-[#616161]">
              {st.current ? <>Current: <strong className="text-[#242424]">version {st.current.version}</strong>, effective {fmtDT(st.current.effectiveAt)}.</> : <span className="font-semibold text-amber-700">No schedule published yet. Real partner agreements cannot be sent until one is.</span>}
            </p>
          </div>
          <button type="button" className={btn} onClick={load} disabled={busy}><RefreshCw className="size-4" /> Refresh</button>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#424242]">
          <li>A new version takes effect the moment it is published. No notice period applies.</li>
          <li>Prospects registered before a change keep their registration-date rates for first-year commission, while the registration is valid.</li>
          <li>Renewal commission is always paid at the version in force at the renewal.</li>
          <li>Published versions are permanent. Every active partner is emailed what changed, and it is recorded on their timeline.</li>
        </ul>
      </div>

      {msg && (
        <div className={`rounded-[4px] px-3 py-2 text-sm ${msg.ok ? "bg-green-50 font-semibold text-green-700" : "bg-red-50 text-[#c50f1f]"}`} role="status">
          <span className="font-semibold">{msg.text}</span>
          {msg.list && msg.list.length > 0 && <ul className="mt-1 list-disc pl-5">{msg.list.map((p, i) => <li key={i}>{p}</li>)}</ul>}
        </div>
      )}

      <div className="rounded-lg border border-[#e0e0e0] bg-white p-5">
        <h3 className="mb-1 flex items-center gap-1.5 text-base font-semibold text-[#242424]"><Calculator className="size-4" /> Automatic rates</h3>
        <p className="mb-3 text-sm text-[#424242]">
          Microsoft and Odoo rates are worked out from your actual margins: the partner&rsquo;s share of the margin at least 80% of the line&rsquo;s products earn, rounded down to the nearest 0.25%.
          Products earning less are listed below each table; agreement clause 5.2 limits commission on them, and on any discounted sale, to the same share of the margin you actually earn.
          Each monthly 4Sight import in the Pricing Catalogue recalculates them. Any change becomes a draft and you are emailed; nothing is published without you.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["sales", "Sales Partner share of margin (%)"],
            ["referral", "Referral Partner share of margin (%)"],
            ["renewal", "Renewal rate, as % of first-year rate"],
          ] as const).map(([k, label]) => (
            <label key={k} className="text-xs font-semibold text-[#424242]">{label}
              <input type="number" min="0" max="100" step="0.5" className={`${input} mt-1`} value={sf[k]} onChange={(e) => { setSf({ ...sf, [k]: e.target.value }); setSfDirty(true) }} />
            </label>
          ))}
          <label className="text-xs font-semibold text-[#424242]">Odoo partnership level
            <select className={`${input} mt-1`} value={sf.odoo} onChange={(e) => { setSf({ ...sf, odoo: e.target.value as Settings["odooLevel"] }); setSfDirty(true) }}>
              <option value="none">Not an Odoo partner</option>
              <option value="ready">Ready (10% licences, 50% Odoo.sh)</option>
              <option value="silver">Silver (15% licences, 50% Odoo.sh)</option>
              <option value="gold">Gold (20% licences, 50% Odoo.sh)</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={sfDirty ? primary : btn} disabled={busy || !sfDirty} onClick={saveSettings}>Save settings and recalculate</button>
          <button type="button" className={btn} disabled={busy} onClick={recalc}><RefreshCw className="size-4" /> Recalculate now</button>
          <span className="self-center text-xs text-[#616161]">
            Price list in use: {st.margins.batch ? <strong>{st.margins.batch}</strong> : <span className="font-semibold text-amber-700">none imported yet</span>}
            {st.settings.updatedBy ? ` \u00b7 settings last changed by ${st.settings.updatedBy}` : ""}
          </span>
        </div>
        {st.guardrails.length > 0 && (
          <div className="mt-3 rounded-[4px] border border-red-200 bg-red-50 p-3 text-sm text-[#c50f1f]">
            <p className="mb-1 flex items-center gap-1.5 font-semibold"><AlertTriangle className="size-4" /> Published rates above what your current margin supports</p>
            <ul className="list-disc space-y-0.5 pl-5">{st.guardrails.map((g, i) => <li key={i}>{g}</li>)}</ul>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-[#616161]">
              <tr><th className="py-1.5 pr-3 font-semibold">Line</th><th className="pr-3 font-semibold">Basis</th><th className="pr-3 font-semibold">Where the rate comes from</th><th className="pr-3 font-semibold">Your margin</th><th className="pr-3 font-semibold">Sales</th><th className="font-semibold">Referral</th></tr>
            </thead>
            <tbody>
              {st.explain.map((e, i) => (
                <tr key={i} className="border-t border-[#f0f0f0] align-top">
                  <td className="py-1.5 pr-3 font-semibold text-[#242424]">{e.line}</td>
                  <td className="pr-3 text-[#424242]">{e.basis}</td>
                  <td className="pr-3 text-[#424242]">{e.auto ? e.source : <span className="text-[#616161]">Set by you in the draft</span>}</td>
                  <td className="pr-3">{e.auto ? pct(e.margin) : "\u2014"}</td>
                  <td className="pr-3">{e.sales}</td>
                  <td>{e.referral}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {st.explain.some((e) => e.below && e.below.length > 0) && (
          <div className="mt-3 space-y-1.5">
            {st.explain.filter((e) => e.below && e.below.length > 0 && !/^Renewals/.test(e.basis)).map((e, i) => (
              <details key={i} className="rounded-[4px] border border-[#e0e0e0] px-3 py-2 text-sm">
                <summary className="cursor-pointer text-[#242424]"><strong>{e.line}</strong>: {e.below!.length} product{e.below!.length === 1 ? "" : "s"} below {pct(e.margin)}, commission limited by clause 5.2</summary>
                <ul className="mt-1.5 list-disc pl-5 text-[#424242]">{e.below!.map((b, j) => <li key={j}>{b.title} <span className="text-[#616161]">({pct(b.margin)})</span></li>)}</ul>
              </details>
            ))}
            {Object.values(st.margins.families).some((f) => f.zero.length > 0) && (
              <details className="rounded-[4px] border border-[#e0e0e0] px-3 py-2 text-sm">
                <summary className="cursor-pointer text-[#242424]"><strong>No margin</strong>: {Object.values(st.margins.families).reduce((n, f) => n + f.zero.length, 0)} products, no commission</summary>
                <ul className="mt-1.5 list-disc pl-5 text-[#424242]">{Object.values(st.margins.families).flatMap((f) => f.zero).map((t, j) => <li key={j}>{t}</li>)}</ul>
              </details>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-[#616161]">Your margins are shown here only. Partners see the resulting rates, never the margin behind them.</p>
      </div>

      <div className="rounded-lg border border-[#e0e0e0] bg-white p-5">
        {!st.draft ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#424242]">{st.current ? "To change the rates, start a new version. It begins as a copy of the current one." : "Start the first version from the standard product lines, then fill in each rate."}</p>
            <button type="button" className={primary} disabled={busy} onClick={async () => { const d = await call("PUT", "/api/partner-commission", { start: true }); if (d) adopt(d) }}>
              <Plus className="size-4" /> {st.current ? `Start version ${(st.current.version || 0) + 1}` : "Start version 1"}
            </button>
          </div>
        ) : (
          <>
            <h3 className="mb-1 text-base font-semibold text-[#242424]">Draft: version {(st.current?.version || 0) + 1}</h3>
            <p className="mb-3 text-xs text-[#616161]">Write rates exactly as partners should read them, for example &ldquo;3% below &#8358;2m; 4% from &#8358;2m to &#8358;10m; 5% above &#8358;10m&rdquo;. Lines are matched between versions by line and basis, so renaming one shows as a removal and an addition.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="text-xs text-[#616161]">
                  <tr><th className="pb-1.5 pr-2 font-semibold">Line of business</th><th className="pr-2 font-semibold">Basis</th><th className="pr-2 font-semibold">Referral Partner rate</th><th className="pr-2 font-semibold">Sales Partner rate</th><th /></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => st.autoKeys.includes(rk(r)) ? (
                    <tr key={i} className="align-top bg-[#fafafa]">
                      <td className="py-1.5 pr-2 font-semibold text-[#242424]">{r.line}</td>
                      <td className="py-1.5 pr-2 text-[#424242]">{r.basis}</td>
                      <td className="py-1.5 pr-2">{r.referral}</td>
                      <td className="py-1.5 pr-2">{r.sales}</td>
                      <td className="py-1.5"><span className="inline-flex items-center gap-1 text-xs text-[#616161]" title="Worked out from your margins and settings. Change the settings above to change it."><Lock className="size-3.5" /> Automatic</span></td>
                    </tr>
                  ) : (
                    <tr key={i} className="align-top">
                      <td className="py-1 pr-2"><input className={input} value={r.line} onChange={(e) => setCell(i, "line", e.target.value)} aria-label={`Line ${i + 1}`} /></td>
                      <td className="py-1 pr-2"><input className={input} value={r.basis} onChange={(e) => setCell(i, "basis", e.target.value)} aria-label={`Basis ${i + 1}`} /></td>
                      <td className="py-1 pr-2"><textarea className={area} rows={Math.max(1, Math.ceil(r.referral.length / 32))} value={r.referral} onChange={(e) => setCell(i, "referral", e.target.value)} aria-label={`Referral rate ${i + 1}`} /></td>
                      <td className="py-1 pr-2"><textarea className={area} rows={Math.max(1, Math.ceil(r.sales.length / 32))} value={r.sales} onChange={(e) => setCell(i, "sales", e.target.value)} aria-label={`Sales rate ${i + 1}`} /></td>
                      <td className="py-1"><button type="button" className="inline-flex size-8 items-center justify-center rounded-[4px] text-[#616161] hover:bg-[#f0f0f0]" title="Remove line" onClick={() => { setRows((p) => p.filter((_, j) => j !== i)); setDirty(true) }}><Trash2 className="size-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={`${btn} mt-2`} onClick={() => { setRows((p) => [...p, { line: "", basis: "", referral: "", sales: "" }]); setDirty(true) }}><Plus className="size-4" /> Add line</button>
            <label className="mt-4 block text-xs font-semibold text-[#424242]">Reason for this change (shown to partners in the update email)
              <textarea value={summary} onChange={(e) => { setSummary(e.target.value); setDirty(true) }} rows={2} className="mt-1 w-full rounded-[4px] border border-[#d1d1d1] bg-white p-2 text-sm font-normal" placeholder="e.g. Microsoft rates aligned to vendor pricing effective October 2026." />
            </label>

            {!dirty && (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-[4px] border border-[#e0e0e0] p-3">
                  <p className="mb-1 text-sm font-semibold text-[#242424]">Changes from {st.current ? `version ${st.current.version}` : "nothing (first version)"}</p>
                  {st.draftChanges.length === 0 ? <p className="text-sm text-[#616161]">No changes yet.</p>
                    : <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#242424]">{st.draftChanges.map((c, i) => <li key={i}>{describe(c)}</li>)}</ul>}
                </div>
                <div className={`rounded-[4px] border p-3 ${st.draftProblems.length ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[#242424]">{st.draftProblems.length ? <><AlertTriangle className="size-4 text-amber-700" /> Not ready to publish</> : "Ready to publish"}</p>
                  {st.draftProblems.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-sm text-amber-900">{st.draftProblems.map((p, i) => <li key={i}>{p}</li>)}</ul>}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f0f0f0] pt-4">
              <button type="button" className={dirty ? primary : btn} disabled={busy || !dirty} onClick={save}>Save draft</button>
              <button type="button" className={primary} disabled={busy || dirty || st.draftProblems.length > 0 || (!!st.current && st.draftChanges.length === 0)} onClick={publish}>
                <Send className="size-4" /> Publish version {(st.current?.version || 0) + 1}
              </button>
              <button type="button" className={btn} disabled={busy} onClick={async () => { if (window.confirm("Discard this draft? The published schedule is not affected.")) { const d = await call("DELETE", "/api/partner-commission"); if (d) adopt(d) } }}>Discard draft</button>
              {dirty && <span className="text-xs text-[#616161]">Save the draft to see its changes and check it is ready.</span>}
            </div>
          </>
        )}
      </div>

      {st.current && (
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-5">
          <h3 className="mb-2 text-base font-semibold text-[#242424]">In force: version {st.current.version}</h3>
          <RatesTable rows={st.current.rows} />
        </div>
      )}

      {st.history.length > 0 && (
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold text-[#242424]"><History className="size-4" /> Version history</h3>
          <ul className="divide-y divide-[#f0f0f0]">
            {st.history.map((v) => (
              <li key={v._id} className="py-2.5">
                <button type="button" className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left" onClick={() => setOpenV(openV === v.version ? null : (v.version ?? null))} aria-expanded={openV === v.version}>
                  <span className="text-sm"><strong>Version {v.version}</strong> <span className="text-[#616161]">· effective {fmtDT(v.effectiveAt)} · by {v.publishedBy}</span></span>
                  <span className="text-xs text-[#616161]">{v.changes.length} change{v.changes.length === 1 ? "" : "s"}{v.notified ? ` · ${v.notified.sent} emailed${v.notified.failed ? `, ${v.notified.failed} failed` : ""}` : ""}</span>
                </button>
                {openV === v.version && (
                  <div className="mt-2 space-y-2">
                    {v.summary && <p className="rounded-[4px] bg-[#f3f8f9] p-2 text-sm text-[#242424]">{v.summary}</p>}
                    {v.changes.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#242424]">{v.changes.map((c, i) => <li key={i}>{describe(c)}</li>)}</ul>}
                    <RatesTable rows={v.rows} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
