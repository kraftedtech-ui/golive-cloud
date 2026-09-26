"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Banknote } from "lucide-react"

type Row = { line: string; basis: string; referral: string; sales: string; usualMargin: number | null; auto: boolean }
type Entry = {
  _id: string; ref: string; kind: string; invoiceReference?: string; receivedAt: string; amount: number; scheduleVersion: number
  line: string; basis: string; band?: string; effectivePct: number; marginLimited: boolean; gross: number; wht: number; net: number
  status: string; dueAt: string; paidAt?: string; paymentReference?: string; clawbackUntil: string; clawbackReason?: string
}
type Eval = { ok: boolean; error?: string; rateText?: string; band?: string; ratePct?: number; effectivePct?: number; marginLimited?: boolean; gross?: number; wht?: number; net?: number; dueAt?: string; scheduleVersion?: number }

const naira = (n: number) => `\u20a6${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const pct = (p: number) => `${Number((p * 100).toFixed(3))}%`
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }) : "\u2014")
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" })
const input = "h-8 w-full rounded-[4px] border border-[#d1d1d1] bg-white px-2 text-sm"
const btn = "inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d1d1d1] bg-white px-3 text-sm font-semibold text-[#242424] hover:bg-[#f5f5f5] disabled:opacity-50"
const primary = "inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#0f8fb0] px-3 text-sm font-semibold text-white hover:bg-[#0b7e9b] disabled:opacity-50"
const STATUS: Record<string, string> = { accrued: "Accrued", paid: "Paid", clawed_back: "Clawed back" }

/**
 * Payments and commission for one won deal. Every figure comes from the
 * server (lib/partnerCommissionLedger), so the preview is exactly what gets recorded.
 */
export default function DealCommission({ dealId, lineOfBusiness, validAtClose, whmcsClientId, whmcsLine, onChanged }: { dealId: string; lineOfBusiness?: string; validAtClose?: boolean; whmcsClientId?: number; whmcsLine?: string; onChanged?: () => void }) {
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin"
  const [entries, setEntries] = useState<Entry[]>([])
  const [opts, setOpts] = useState<{ firstYear: { version: number; rows: Row[] } | null; renewal: { version: number; rows: Row[] } | null; category: string } | null>(null)
  const [f, setF] = useState({ kind: validAtClose ? "first_year" : "renewal", rowIndex: -1, receivedAt: today(), amount: "", contractValue: "", invoiceReference: "", actualMargin: "", usualMargin: "", wht: "5", note: "" })
  const [ev, setEv] = useState<Eval | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [invoices, setInvoices] = useState<{ invoiceNumber: string; buyerName: string; acceptedAt: string; currency: string; netTotal: number; amountNGN: number | null; margin: number | null; matches: boolean; used: boolean }[]>([])
  const [wh, setWh] = useState({ clientId: whmcsClientId ? String(whmcsClientId) : "", line: whmcsLine || "Web hosting, domains and websites" })

  async function load() {
    const r = await fetch(`/api/partner-commissions?deal=${dealId}`); const d = await r.json()
    setEntries(d.entries || []); setOpts({ firstYear: d.firstYear, renewal: d.renewal, category: d.category })
  }
  useEffect(() => { load(); fetch(`/api/partner-commissions/invoices?deal=${dealId}`).then((r) => r.json()).then((d) => setInvoices(d.invoices || [])).catch(() => {}) }, [dealId])

  function fillFromInvoice(num: string) {
    const inv = invoices.find((x) => x.invoiceNumber === num)
    if (!inv) return
    setF((p) => ({ ...p, invoiceReference: inv.invoiceNumber, amount: inv.amountNGN !== null ? String(inv.amountNGN) : p.amount, contractValue: inv.amountNGN !== null ? String(inv.amountNGN) : p.contractValue,
      actualMargin: inv.margin !== null ? String(Math.round(inv.margin * 1000) / 10) : p.actualMargin, receivedAt: p.receivedAt }))
    setEv(null)
  }
  async function linkWhmcs(remove = false) {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/partner-deals/${dealId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "linkWhmcs", clientId: remove ? null : Number(wh.clientId), line: wh.line }) })
      const d = await r.json()
      if (!r.ok) { setMsg({ ok: false, text: d.error }); return }
      setMsg({ ok: true, text: remove ? "Link removed." : `Linked to GoLive Naija client ${wh.clientId}. Paid invoices for this client now record commission automatically.` })
      onChanged?.()
    } finally { setBusy(false) }
  }

  const rows = (f.kind === "first_year" ? opts?.firstYear?.rows : opts?.renewal?.rows) || []
  // Pre-select the row matching the deal's line of business and the payment kind.
  useEffect(() => {
    if (!rows.length) return
    const renewal = f.kind === "renewal"
    let i = rows.findIndex((r) => r.line === lineOfBusiness && /^renewals/i.test(r.basis) === renewal)
    if (i < 0 && renewal && /microsoft|dynamics|copilot/i.test(lineOfBusiness || "")) i = rows.findIndex((r) => r.line === "Microsoft subscriptions")
    if (i < 0) i = rows.findIndex((r) => r.line === lineOfBusiness)
    const row = rows[i]
    setF((p) => ({ ...p, rowIndex: i, usualMargin: row?.usualMargin != null ? String(Math.round(row.usualMargin * 1000) / 10) : "" }))
    setEv(null)
  }, [f.kind, opts])

  const body = () => ({
    dealId, kind: f.kind, rowIndex: f.rowIndex, receivedAt: f.receivedAt, amount: Number(f.amount.replace(/[^\d.]/g, "")),
    contractValue: f.contractValue ? Number(f.contractValue.replace(/[^\d.]/g, "")) : undefined,
    actualMargin: f.actualMargin ? Number(f.actualMargin) / 100 : null, usualMargin: f.usualMargin ? Number(f.usualMargin) / 100 : null,
    whtRate: Number(f.wht) / 100, invoiceReference: f.invoiceReference, note: f.note,
  })
  async function preview() {
    setBusy(true); setMsg(null)
    try { const r = await fetch("/api/partner-commissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body(), preview: true }) }); setEv(await r.json()) } finally { setBusy(false) }
  }
  async function record() {
    if (!ev?.ok || !window.confirm(`Record ${naira(ev.gross!)} commission (${naira(ev.net!)} after withholding tax)? The partner is emailed.`)) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch("/api/partner-commissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body()) })
      const d = await r.json()
      if (!r.ok) { setMsg({ ok: false, text: d.error }); return }
      setMsg({ ok: true, text: `Recorded as ${d.entry.ref}. The partner has been emailed.` }); setEv(null)
      setF((p) => ({ ...p, amount: "", invoiceReference: "", actualMargin: "", note: "" })); await load()
    } finally { setBusy(false) }
  }
  async function act(id: string, payload: Record<string, unknown>, ok: string) {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch(`/api/partner-commissions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) { setMsg({ ok: false, text: d.error }); return }
      setMsg({ ok: true, text: ok }); await load()
    } finally { setBusy(false) }
  }

  const set = (k: keyof typeof f, v: string | number) => { setF({ ...f, [k]: v }); setEv(null) }
  const row = rows[f.rowIndex]

  return (
    <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
      <p className="mb-2 flex items-center gap-1.5 font-semibold"><Banknote className="size-4" /> Payments received and commission</p>
      {isAdmin && <div className="mb-3 rounded-[4px] border border-[#e0e0e0] p-2.5">
        <p className="mb-1.5 text-xs font-semibold text-[#424242]">GoLive Naija billing (automatic)</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-[#424242]">WHMCS client ID<input className={`${input} mt-1 w-36`} inputMode="numeric" placeholder="e.g. 1234" value={wh.clientId} onChange={(e) => setWh({ ...wh, clientId: e.target.value.replace(/\D/g, "") })} /></label>
          <label className="min-w-[240px] flex-1 text-xs text-[#424242]">Schedule line for its invoices
            <select className={`${input} mt-1`} value={wh.line} onChange={(e) => setWh({ ...wh, line: e.target.value })}>
              {[...new Set((opts?.renewal?.rows || []).map((r) => r.line))].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <button type="button" className={btn} disabled={busy || !wh.clientId} onClick={() => linkWhmcs(false)}>{whmcsClientId ? "Update link" : "Link client"}</button>
          {whmcsClientId ? <button type="button" className={btn} disabled={busy} onClick={() => linkWhmcs(true)}>Remove link</button> : null}
        </div>
        <p className="mt-1 text-xs text-[#616161]">{whmcsClientId ? `Linked to client ${whmcsClientId}: each paid invoice records commission automatically (domain items excluded).` : "The client ID is the number after userid= in the client's profile address in the WHMCS admin area."}</p>
      </div>}

      {invoices.length > 0 && (
        <label className="mb-2 block text-xs font-semibold text-[#424242]">Fill from a portal invoice
          <select className={`${input} mt-1`} defaultValue="" onChange={(e) => fillFromInvoice(e.target.value)}>
            <option value="">Choose an accepted invoice (matching buyers first)</option>
            {invoices.map((i) => (
              <option key={i.invoiceNumber} value={i.invoiceNumber} disabled={i.used}>
                {i.invoiceNumber}: {i.buyerName}{i.amountNGN !== null ? `, \u20a6${i.amountNGN.toLocaleString("en-NG")} ex VAT` : `, ${i.currency} ${i.netTotal}`}{i.margin !== null ? `, margin ${Math.round(i.margin * 1000) / 10}%` : ""}{i.used ? " (already recorded)" : ""}{i.matches ? "" : " (different buyer)"}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-[#424242]">Payment for
          <select className={`${input} mt-1`} value={f.kind} onChange={(e) => set("kind", e.target.value)}>
            <option value="first_year" disabled={!validAtClose}>First year{validAtClose ? "" : " (not payable: closed after lapse)"}</option>
            <option value="renewal">Renewal</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#424242] lg:col-span-3">Schedule line ({f.kind === "first_year" ? `version ${opts?.firstYear?.version ?? "\u2014"}, locked at registration` : `version ${opts?.renewal?.version ?? "\u2014"}, in force now`})
          <select className={`${input} mt-1`} value={f.rowIndex} onChange={(e) => { const i = Number(e.target.value); const r = rows[i]; setF({ ...f, rowIndex: i, usualMargin: r?.usualMargin != null ? String(Math.round(r.usualMargin * 1000) / 10) : "" }); setEv(null) }}>
            <option value={-1}>Choose the line</option>
            {rows.map((r, i) => <option key={i} value={i}>{r.line}: {r.basis} ({opts?.category === "sales" ? r.sales : r.referral})</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#424242]">Date payment cleared<input type="date" className={`${input} mt-1`} max={today()} value={f.receivedAt} onChange={(e) => set("receivedAt", e.target.value)} /></label>
        <label className="text-xs font-semibold text-[#424242]">Amount received, ex VAT (₦)<input className={`${input} mt-1`} inputMode="decimal" value={f.amount} onChange={(e) => set("amount", e.target.value)} /></label>
        <label className="text-xs font-semibold text-[#424242]">Contract value for bands (₦)<input className={`${input} mt-1`} inputMode="decimal" placeholder="Defaults to the amount" value={f.contractValue} onChange={(e) => set("contractValue", e.target.value)} /></label>
        <label className="text-xs font-semibold text-[#424242]">Invoice reference<input className={`${input} mt-1`} value={f.invoiceReference} onChange={(e) => set("invoiceReference", e.target.value)} /></label>
        <label className="text-xs font-semibold text-[#424242]">Your actual margin on this sale (%)<input className={`${input} mt-1`} inputMode="decimal" placeholder="Only if below usual" value={f.actualMargin} onChange={(e) => set("actualMargin", e.target.value)} /></label>
        <label className="text-xs font-semibold text-[#424242]">Usual margin on this line (%)<input className={`${input} mt-1`} inputMode="decimal" placeholder={row?.auto ? "" : "Needed for a margin limit"} value={f.usualMargin} onChange={(e) => set("usualMargin", e.target.value)} /></label>
        <label className="text-xs font-semibold text-[#424242]">Withholding tax (%)<input className={`${input} mt-1`} inputMode="decimal" value={f.wht} onChange={(e) => set("wht", e.target.value)} /></label>
        <label className="text-xs font-semibold text-[#424242]">Note<input className={`${input} mt-1`} value={f.note} onChange={(e) => set("note", e.target.value)} /></label>
      </div>
      <p className="mt-1.5 text-xs text-[#616161]">Withholding tax defaults to 5%; confirm the correct rate for this partner with your accountant. Enter your actual margin only when it is below the line&rsquo;s usual margin (a discount or low-margin product); clause 5.2 then limits the commission.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className={btn} disabled={busy || f.rowIndex < 0 || !f.amount} onClick={preview}>Preview commission</button>
        {isAdmin ? <button type="button" className={primary} disabled={busy || !ev?.ok} onClick={record}>Record payment</button> : <span className="text-xs text-[#616161]">Preview only: the administrator records payments.</span>}
      </div>
      {ev && (
        <div className={`mt-2 rounded-[4px] p-2 text-sm ${ev.ok ? "bg-[#f3f8f9]" : "bg-red-50 text-[#c50f1f]"}`}>
          {ev.ok ? <>Rate {ev.rateText}{ev.band ? ` \u2192 band "${ev.band}"` : ""}: <strong>{pct(ev.effectivePct!)}</strong>{ev.marginLimited ? ` (limited from ${pct(ev.ratePct!)} under clause 5.2)` : ""}.
            Commission <strong>{naira(ev.gross!)}</strong>, withholding tax {naira(ev.wht!)}, net <strong>{naira(ev.net!)}</strong>, payable by {fmt(ev.dueAt)}.</> : ev.error}
        </div>
      )}
      {msg && <div className={`mt-2 rounded-[4px] px-2 py-1.5 text-sm font-semibold ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-[#c50f1f]"}`}>{msg.text}</div>}

      {entries.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="text-[#616161]"><tr><th className="py-1.5 pr-2 font-semibold">Reference</th><th className="pr-2 font-semibold">Received</th><th className="pr-2 font-semibold">Amount</th><th className="pr-2 font-semibold">Rate</th><th className="pr-2 font-semibold">Commission</th><th className="pr-2 font-semibold">Net</th><th className="pr-2 font-semibold">Status</th><th /></tr></thead>
            <tbody>{entries.map((e) => (
              <tr key={e._id} className="border-t border-[#f0f0f0] align-top text-[#242424]">
                <td className="py-1.5 pr-2 font-mono">{e.ref}<div className="font-sans text-[#616161]">{e.kind === "renewal" ? "Renewal" : "First year"} · v{e.scheduleVersion}{e.invoiceReference ? ` · ${e.invoiceReference}` : ""}</div></td>
                <td className="pr-2">{fmt(e.receivedAt)}</td>
                <td className="pr-2">{naira(e.amount)}</td>
                <td className="pr-2">{pct(e.effectivePct)}{e.marginLimited ? " (5.2)" : ""}</td>
                <td className="pr-2">{naira(e.gross)}</td>
                <td className="pr-2">{naira(e.net)}</td>
                <td className="pr-2">{STATUS[e.status]}{e.status === "accrued" ? <div className="text-[#616161]">due {fmt(e.dueAt)}</div> : e.status === "paid" ? <div className="text-[#616161]">{fmt(e.paidAt)} · {e.paymentReference}</div> : <div className="text-[#616161]">{e.clawbackReason}</div>}</td>
                <td className="whitespace-nowrap">
                  {isAdmin && e.status === "accrued" && <button type="button" className={`${btn} h-7 text-xs`} disabled={busy} onClick={() => { const ref = window.prompt("Payment reference (bank transfer or voucher):", ""); if (ref) act(e._id, { action: "paid", reference: ref, paidAt: today() }, `${e.ref} marked paid.`) }}>Mark paid</button>}
                  {isAdmin && e.status !== "clawed_back" && new Date(e.clawbackUntil).getTime() > Date.now() && <button type="button" className={`${btn} ml-1 h-7 text-xs`} disabled={busy} onClick={() => { const r = window.prompt("Reason: cancellation, refund or default within 90 days of payment:", ""); if (r) act(e._id, { action: "clawback", reason: r }, `${e.ref} clawed back.`) }}>Claw back</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
