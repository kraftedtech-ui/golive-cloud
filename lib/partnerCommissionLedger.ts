/**
 * partnerCommissionLedger.ts: records payments received on partners' won
 * deals as commission lines. SERVER ONLY.
 *
 * Clause 5 as built:
 *   - first-year commission uses the schedule version locked at registration,
 *     and only if the registration was valid when the deal closed (5.5);
 *   - renewal commission uses the version in force on the renewal date (5.5);
 *   - banded rates choose the band on contract value, then apply to the
 *     amount received excluding VAT and at-cost items (5.2);
 *   - a lower actual margin limits commission proportionally (5.2);
 *   - payable within 30 days of payment clearing, less withholding tax (5.2);
 *   - recoverable if the client cancels, is refunded or defaults within 90
 *     days of payment (5.3).
 *
 * recordPartnerPayment() is the single entry point, used by the admin form
 * today and by any future online checkout ("automatic" source).
 */

import { Resend } from 'resend'
import CommissionSchedule from '@/models/CommissionSchedule'
import DealRegistration, { type IDealRegistration } from '@/models/DealRegistration'
import PartnerCommission, { type IPartnerCommission } from '@/models/PartnerCommission'
import { currentSchedule, rowKey } from '@/lib/commissionSchedule'
import { buildRows, computeMargins, getSettings, AUTO_KEYS } from '@/lib/commissionRules'
import { parseRate, applyMarginLimit, computeCommission, pctText } from '@/lib/commissionMath'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'
import { PORTAL_URL, COMPANY, COMPANY_RC } from '@/lib/offerConfig'

const DAY = 864e5
export const PAYABLE_DAYS = 30
export const CLAWBACK_DAYS = 90

export type ScheduleRow = { line: string; basis: string; referral: string; sales: string; usualMargin: number | null; auto: boolean }

/** The rows of one schedule version, with the usual margin of each automatic line (today's calculation). */
export async function versionRows(version?: number | null): Promise<{ version: number; rows: ScheduleRow[] } | null> {
  const sched = version ? await CommissionSchedule.findOne({ status: 'published', version }) : await currentSchedule()
  if (!sched?.version) return null
  const [settings, margins] = await Promise.all([getSettings(), computeMargins()])
  const explain = buildRows(settings, margins, sched.rows.map((r) => ({ line: r.line, basis: r.basis, referral: r.referral, sales: r.sales }))).explain
  const usual = new Map(explain.map((e) => [rowKey(e), e.margin]))
  return {
    version: sched.version,
    rows: sched.rows.map((r) => ({ line: r.line, basis: r.basis, referral: r.referral, sales: r.sales, auto: AUTO_KEYS.has(rowKey(r)), usualMargin: usual.get(rowKey(r)) ?? null })),
  }
}

export type PaymentInput = {
  dealId: string
  kind: 'first_year' | 'renewal'
  rowIndex: number
  receivedAt: string | Date
  amount: number
  contractValue?: number
  actualMargin?: number | null
  usualMargin?: number | null
  whtRate: number
  invoiceReference?: string
  note?: string
}

export type Evaluation = {
  ok: boolean
  error?: string
  scheduleVersion?: number
  line?: string
  basis?: string
  rateText?: string
  band?: string
  ratePct?: number
  effectivePct?: number
  marginLimited?: boolean
  gross?: number
  wht?: number
  net?: number
  dueAt?: Date
  clawbackUntil?: Date
}

/** Works out a payment's commission without saving anything. */
export async function evaluatePayment(p: PaymentInput, deal?: IDealRegistration | null): Promise<Evaluation> {
  const d = deal || await DealRegistration.findById(p.dealId)
  if (!d) return { ok: false, error: 'Registration not found.' }
  if (d.status !== 'won') return { ok: false, error: 'Commission is recorded only on a won deal. Mark the deal as won first.' }
  if (p.kind === 'first_year' && !d.validAtClose) return { ok: false, error: 'This deal closed after its registration lapsed, so no first-year commission is payable (clause 5.5). Renewal commission may still apply.' }
  if (!(p.amount > 0)) return { ok: false, error: 'Enter the amount received, excluding VAT.' }
  if (!(p.whtRate >= 0 && p.whtRate < 1)) return { ok: false, error: 'Enter the withholding tax rate.' }
  const received = new Date(p.receivedAt)
  if (isNaN(received.getTime()) || received.getTime() > Date.now() + DAY) return { ok: false, error: 'Enter the date the payment cleared.' }

  const vr = p.kind === 'first_year' ? await versionRows(d.scheduleVersion) : await versionRows(null)
  if (!vr) return { ok: false, error: p.kind === 'first_year' ? 'The deal has no locked schedule version.' : 'No commission schedule is published.' }
  const row = vr.rows[p.rowIndex]
  if (!row) return { ok: false, error: 'Choose the schedule line this payment falls under.' }
  const rateText = d.category === 'sales' ? row.sales : row.referral
  const parsed = parseRate(rateText, p.contractValue ?? p.amount)
  if (parsed.pct === null) return { ok: false, error: `No commission on this line: ${parsed.reason}`, scheduleVersion: vr.version, line: row.line, basis: row.basis, rateText }
  const usual = typeof p.usualMargin === 'number' ? p.usualMargin : row.usualMargin
  const lim = applyMarginLimit(parsed.pct, p.actualMargin, usual)
  const money = computeCommission(p.amount, lim.pct, p.whtRate)
  return {
    ok: true, scheduleVersion: vr.version, line: row.line, basis: row.basis, rateText, band: parsed.band,
    ratePct: parsed.pct, effectivePct: lim.pct, marginLimited: lim.limited, ...money,
    dueAt: new Date(received.getTime() + PAYABLE_DAYS * DAY), clawbackUntil: new Date(received.getTime() + CLAWBACK_DAYS * DAY),
  }
}

async function nextRef(now = new Date()): Promise<string> {
  const prefix = `GL-COM-${now.getFullYear()}-`
  const refs = (await PartnerCommission.distinct('ref', { ref: { $regex: `^${prefix}` } })) as string[]
  const max = refs.reduce((m, r) => Math.max(m, parseInt(r.slice(prefix.length), 10) || 0), 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

/** Records a payment as a commission line and emails the partner. */
export async function recordPartnerPayment(p: PaymentInput, by: string, source: 'manual' | 'automatic' = 'manual'): Promise<{ ok: boolean; error?: string; entry?: IPartnerCommission }> {
  const d = await DealRegistration.findById(p.dealId)
  const e = await evaluatePayment(p, d)
  if (!e.ok || !d) return { ok: false, error: e.error }
  const now = new Date()
  const entry = await PartnerCommission.create({
    ref: await nextRef(now), deal: d._id, dealRef: d.ref, partnerApplication: d.partnerApplication, partnerNumber: d.partnerNumber,
    partnerName: d.partnerName, organisation: d.organisation, kind: p.kind, invoiceReference: p.invoiceReference?.trim() || undefined,
    receivedAt: new Date(p.receivedAt), amount: p.amount, contractValue: p.contractValue, scheduleVersion: e.scheduleVersion,
    line: e.line, basis: e.basis, rateText: e.rateText, band: e.band, ratePct: e.ratePct,
    actualMargin: p.actualMargin ?? undefined, usualMargin: typeof p.usualMargin === 'number' ? p.usualMargin : undefined,
    marginLimited: e.marginLimited, effectivePct: e.effectivePct, gross: e.gross, whtRate: p.whtRate, wht: e.wht, net: e.net,
    status: 'accrued', dueAt: e.dueAt, clawbackUntil: e.clawbackUntil, recordedBy: by, source, note: p.note?.trim() || undefined,
  })
  d.timeline.push({ at: now, by, action: `Payment recorded: \u20a6${p.amount.toLocaleString('en-NG')} received ${new Date(p.receivedAt).toISOString().slice(0, 10)}; commission ${entry.ref} \u20a6${e.gross!.toLocaleString('en-NG')} (${p.kind === 'renewal' ? 'renewal' : 'first year'})` })
  await d.save()
  notifyPartner(entry, d.partnerEmail)
  return { ok: true, entry }
}

/* ------------------------------------------------------------------ emails */

const resend = new Resend(process.env.RESEND_API_KEY)
const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const n = (x: number) => `\u20a6${x.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })

async function notifyPartner(c: IPartnerCommission, to: string) {
  try {
    await resend.emails.send({
      from: `GoLive Partner Network <${PARTNER_EMAIL}>`, to, reply_to: PARTNER_EMAIL,
      subject: `Commission recorded: ${c.organisation} (${c.ref})`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
        <p>Dear ${esc(c.partnerName.split(/\s+/)[0])},</p>
        <p>GoLive has received a payment from <strong>${esc(c.organisation)}</strong>, and your commission has been recorded.</p>
        <table style="border-collapse:collapse;font-size:14px;margin:6px 0 14px">
          <tr><td style="padding:3px 14px 3px 0;color:#666">Reference</td><td>${esc(c.ref)} (${c.kind === 'renewal' ? 'renewal' : 'first year'})</td></tr>
          <tr><td style="padding:3px 14px 3px 0;color:#666">Amount received (ex VAT)</td><td>${n(c.amount)} on ${fmt(c.receivedAt)}</td></tr>
          <tr><td style="padding:3px 14px 3px 0;color:#666">Rate</td><td>${esc(pctText(c.effectivePct))}${c.marginLimited ? ' (limited under clause 5.2)' : ''}, schedule version ${c.scheduleVersion}</td></tr>
          <tr><td style="padding:3px 14px 3px 0;color:#666">Commission</td><td>${n(c.gross)}, less withholding tax ${n(c.wht)}: <strong>${n(c.net)}</strong></td></tr>
          <tr><td style="padding:3px 14px 3px 0;color:#666">Payable by</td><td>${fmt(c.dueAt)}</td></tr>
        </table>
        <p style="font-size:13px;color:#555">Commission is recoverable if the client cancels, is refunded or defaults before ${fmt(c.clawbackUntil)} (clause 5.3). Your statement is in your <a href="${PORTAL_URL}/partner" style="color:#0b7e9b">partner dashboard</a>.</p>
        <p style="margin-bottom:2px">Yours sincerely,</p><p style="margin-top:0"><strong style="color:#0e7c86">GoLive Partner Network</strong><br>${esc(COMPANY)}<br><span style="font-size:12px;color:#777">${esc(COMPANY_RC)}</span></p></div>`,
    })
  } catch (err) { console.error('[partner-commission] email failed:', (err as Error).message) }
}
