/**
 * whmcsIntegration.ts: GoLive Naija billing (WHMCS) -> partner commission.
 * SERVER ONLY.
 *
 * A hook installed in WHMCS (integrations/whmcs/golive_partner_commission.php)
 * posts every paid invoice here, signed with WHMCS_HOOK_SECRET:
 *   X-GoLive-Timestamp  unix seconds
 *   X-GoLive-Signature  hex HMAC-SHA256 of `${timestamp}.${rawBody}`
 *
 * An invoice records commission only when its WHMCS client is linked to a
 * partner's WON deal registration. Everything else is logged and skipped.
 *   - domain items are excluded (the schedule excludes domain registrations);
 *   - payments in the 12 months after the deal was won are first-year;
 *     months 13 to 36 are renewals, at the rate in force at renewal;
 *     after that, nothing (the schedule pays renewals for years 2 and 3);
 *   - a line with no renewal row in the schedule pays no renewal commission;
 *   - only naira invoices are processed automatically.
 */

import crypto from 'crypto'
import DealRegistration from '@/models/DealRegistration'
import PartnerCommission from '@/models/PartnerCommission'
import WhmcsInvoiceEvent from '@/models/WhmcsInvoiceEvent'
import { versionRows, recordPartnerPayment } from '@/lib/partnerCommissionLedger'

export const WHMCS_DEFAULT_LINE = 'Web hosting, domains and websites'
const DAY = 864e5
const MAX_SKEW_SECONDS = 600

export type WhmcsPayload = {
  invoiceId: number
  invoiceNum?: string
  clientId: number
  companyName?: string
  email?: string
  currency?: string
  datePaid?: string
  subtotal?: number
  tax?: number
  total?: number
  items: { type: string; description: string; amount: number; relid?: number }[]
}

export function verifyWhmcsSignature(raw: string, timestamp: string | null, signature: string | null, now = Date.now()): boolean {
  const secret = process.env.WHMCS_HOOK_SECRET || ''
  if (!secret || !timestamp || !signature) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > MAX_SKEW_SECONDS) return false
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')
  const a = Buffer.from(expected), b = Buffer.from(String(signature).trim().toLowerCase())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Pure: which items earn commission, and their total. Domain items never do.
 * WHMCS types items from domain orders DomainRegister/DomainTransfer/Domain...,
 * but lines typed by hand on an invoice have no type, so the word "domain" in
 * the description also excludes an item. Hosting lines name the domain they
 * serve (e.g. "GoLive Advanced - acme.com.ng") without the word "domain".
 */
export const isDomainItem = (i: { type?: string; description?: string }) =>
  /^domain/i.test(i.type || '') || /\bdomains?\b/i.test(i.description || '')

export function commissionableItems(items: WhmcsPayload['items']) {
  const counted = items.filter((i) => !isDomainItem(i) && Number(i.amount) > 0)
  const excluded = items.filter((i) => !counted.includes(i))
  return { counted, excluded, amount: Math.round(counted.reduce((s, i) => s + Number(i.amount), 0) * 100) / 100 }
}

/** Pure: first year, renewal, or outside the window, measured from the date the deal was won. */
export function paymentKind(wonAt: Date, paidAt: Date): 'first_year' | 'renewal' | null {
  const days = (paidAt.getTime() - wonAt.getTime()) / DAY
  if (days < 365) return 'first_year'
  if (days < 365 * 3) return 'renewal'
  return null
}

const parseWhmcsDate = (s?: string) => {
  if (!s || /^0000/.test(s)) return new Date()
  const d = new Date(`${s.replace(' ', 'T')}+01:00`)
  return isNaN(d.getTime()) ? new Date() : d
}

export async function processInvoicePaid(p: WhmcsPayload): Promise<{ status: 'recorded' | 'skipped' | 'error' | 'duplicate'; reason?: string; refs?: string[] }> {
  const base = { invoiceId: p.invoiceId, invoiceNum: p.invoiceNum, clientId: p.clientId, companyName: p.companyName, currency: p.currency, datePaid: parseWhmcsDate(p.datePaid), total: p.total, payload: p, commissionRefs: [] as string[] }
  // Claim the invoice first: the unique index makes a repeated notice a no-op.
  let ev
  try { ev = await WhmcsInvoiceEvent.create({ ...base, status: 'skipped', reason: 'processing' }) }
  catch (e) { if ((e as { code?: number }).code === 11000) return { status: 'duplicate', reason: 'Already received' }; throw e }

  const finish = async (status: 'recorded' | 'skipped' | 'error', reason?: string, refs: string[] = [], deal?: unknown) => {
    ev.status = status; ev.reason = reason; ev.commissionRefs = refs
    if (deal) ev.deal = deal as typeof ev.deal
    await ev.save()
    return { status, reason, refs }
  }

  try {
    const deal = await DealRegistration.findOne({ whmcsClientId: p.clientId }).sort({ whmcsLinkedAt: -1 })
    if (!deal) return finish('skipped', 'WHMCS client is not linked to a partner deal')
    const note = (action: string, n?: string) => deal.timeline.push({ at: new Date(), by: 'GoLive Naija billing', action, note: n })
    const skip = async (reason: string) => { note(`GoLive Naija invoice ${p.invoiceNum || p.invoiceId} paid: no commission`, reason); await deal.save(); return finish('skipped', reason, [], deal._id) }

    if (deal.status !== 'won' || !deal.closedAt) return skip(`Deal ${deal.ref} is not marked won`)
    if ((p.currency || '').toUpperCase() !== 'NGN') return skip(`Invoice currency is ${p.currency || 'unknown'}; record it manually`)
    const paidAt = parseWhmcsDate(p.datePaid)
    const kind = paymentKind(new Date(deal.closedAt), paidAt)
    if (!kind) return skip('Paid more than three years after the deal was won: outside the commission window')
    if (kind === 'first_year' && !deal.validAtClose) return skip('The deal closed after its registration lapsed: no first-year commission (clause 5.5)')

    const { counted, excluded, amount } = commissionableItems(p.items || [])
    if (!(amount > 0)) return skip(excluded.length ? 'Only domain items on this invoice (domain registrations are excluded)' : 'Nothing commissionable on this invoice')

    const vr = await versionRows(kind === 'first_year' ? deal.scheduleVersion : null)
    if (!vr) return skip('No commission schedule version available')
    const line = deal.whmcsLine || WHMCS_DEFAULT_LINE
    const rowIndex = vr.rows.findIndex((r) => r.line === line && /^renewals/i.test(r.basis) === (kind === 'renewal'))
    if (rowIndex < 0) return skip(kind === 'renewal' ? `The schedule pays no renewal commission on "${line}"` : `"${line}" is not in schedule version ${vr.version}`)

    const dup = await PartnerCommission.findOne({ deal: deal._id, invoiceReference: `WHMCS ${p.invoiceNum || p.invoiceId}` })
    if (dup) return finish('skipped', `Already recorded as ${dup.ref}`, [dup.ref], deal._id)

    const r = await recordPartnerPayment({
      dealId: String(deal._id), kind, rowIndex, receivedAt: paidAt, amount, contractValue: amount,
      whtRate: Number(process.env.PARTNER_WHT_RATE || '0.05'), invoiceReference: `WHMCS ${p.invoiceNum || p.invoiceId}`,
      note: `GoLive Naija billing. Counted: ${counted.map((i) => i.description).join('; ').slice(0, 300)}${excluded.length ? `. Excluded: ${excluded.length} domain item(s)` : ''}`,
    }, 'GoLive Naija billing', 'automatic')
    if (!r.ok || !r.entry) return skip(r.error || 'Commission could not be calculated')
    return finish('recorded', `${kind === 'renewal' ? 'Renewal' : 'First-year'} commission recorded`, [r.entry.ref], deal._id)
  } catch (e) {
    console.error('[whmcs] processing failed:', e)
    return finish('error', (e as Error).message?.slice(0, 300) || 'Processing failed')
  }
}
