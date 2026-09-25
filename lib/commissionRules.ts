/**
 * commissionRules.ts: derives the partner commission schedule from GoLive's
 * actual margins. SERVER ONLY.
 *
 * Every line is one of three kinds:
 *   auto (Microsoft)  rate = partner share x the line's typical margin: the
 *                     margin at least 80% of its products earn, in the latest
 *                     4Sight price list (margins rounded to the nearest 0.5%,
 *                     since 4Sight's prices carry rounding noise). Products
 *                     below it are not ignored: agreement clause 5.2 limits
 *                     commission on them to the same share of the margin
 *                     actually earned, as it does for discounted sales.
 *   auto (Odoo)       rate = partner share x GoLive's Odoo commission at its
 *                     current partnership level (not available until joined)
 *   manual            GoLive's own services: rates set by the MD in the editor
 *
 * Rates are rounded DOWN to the nearest 0.25 percentage points.
 * Renewal rates are the first-year rate x renewalFactor.
 *
 * A change in any input (monthly price list import, Odoo level, shares)
 * produces a DRAFT and emails the MD. Nothing is ever published automatically:
 * publishing is a contractual act that notifies every partner and is permanent.
 */

import { Resend } from 'resend'
import CommissionSchedule, { type IScheduleRow } from '@/models/CommissionSchedule'
import CommissionSettings, { type ICommissionSettings, type OdooLevel } from '@/models/CommissionSettings'
import { PricingCatalog } from '@/models/PricingCatalog'
import { currentSchedule, diffRows, rowKey } from '@/lib/commissionSchedule'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'
import { PORTAL_URL } from '@/lib/offerConfig'

export const RATE_STEP = 0.0025
export const DISTRIBUTOR = '4Sight Dynamics Africa'

export const ODOO_MARGINS: Record<OdooLevel, { licence: number; hosting: number } | null> = {
  none: null,
  ready: { licence: 0.10, hosting: 0.50 },
  silver: { licence: 0.15, hosting: 0.50 },
  gold: { licence: 0.20, hosting: 0.50 },
}
export const ODOO_LEVEL_LABEL: Record<OdooLevel, string> = { none: 'Not an Odoo partner', ready: 'Ready', silver: 'Silver', gold: 'Gold' }

/** Microsoft product families, matched on the price list's SKU title. */
export const FAMILIES = {
  // Bundles such as "Microsoft 365 Business Premium with Copilot" belong here;
  // only the standalone Copilot add-on is its own line.
  m365: { label: 'Microsoft 365 and cloud subscriptions', pattern: '^(Microsoft 365|Office 365|Exchange Online|Microsoft Teams|Enterprise Mobility|Microsoft Defender|Microsoft Intune|Microsoft Entra|Microsoft Purview|Project|Visio|Power BI)', exclude: '^Microsoft 365 Copilot' },
  // The standalone Microsoft 365 Copilot add-on. Copilot Studio is a separate
  // Power Platform product and deliberately not included.
  copilot: { label: 'Microsoft 365 Copilot', pattern: '^Microsoft 365 Copilot', exclude: '' },
  dynamics: { label: 'Dynamics 365', pattern: '^Dynamics 365', exclude: '' },
} as const
export type Family = keyof typeof FAMILIES

type Source =
  | { kind: 'catalogue'; families: Family[] }
  | { kind: 'odoo'; what: 'licence' | 'hosting' }
  | { kind: 'nomargin' }
  | { kind: 'manual'; referral: string; sales: string }

type LineDef = { line: string; basis: string; source: Source; renewal?: boolean }

const RENEWALS = 'Renewals, years 2 and 3, while the account is retained'
const NOT_ODOO = 'Available once GoLive\u2019s Odoo partnership is active'

/** The schedule, in the order partners see it. */
export const LINES: LineDef[] = [
  { line: 'Microsoft 365 and cloud subscriptions', basis: 'First-year subscription value', source: { kind: 'catalogue', families: ['m365'] } },
  { line: 'Microsoft 365 Copilot', basis: 'First-year subscription value', source: { kind: 'catalogue', families: ['copilot'] } },
  { line: 'Dynamics 365', basis: 'First-year subscription value', source: { kind: 'catalogue', families: ['dynamics'] } },
  { line: 'Microsoft subscriptions', basis: RENEWALS, source: { kind: 'catalogue', families: ['m365', 'copilot', 'dynamics'] }, renewal: true },
  { line: 'Odoo licences', basis: 'First-year licence value', source: { kind: 'odoo', what: 'licence' } },
  { line: 'Odoo licences', basis: RENEWALS, source: { kind: 'odoo', what: 'licence' }, renewal: true },
  { line: 'Odoo.sh hosting', basis: 'First-year hosting fee', source: { kind: 'odoo', what: 'hosting' } },
  { line: 'Odoo.sh hosting', basis: RENEWALS, source: { kind: 'odoo', what: 'hosting' }, renewal: true },
  { line: 'Odoo implementation', basis: 'Fees received for the project', source: { kind: 'manual', referral: '[rate]', sales: '[rate]' } },
  { line: 'Odoo support', basis: 'Annual support fees, while the account is retained', source: { kind: 'manual', referral: '[rate]', sales: '[rate]' } },
  { line: 'Custom software and project services', basis: 'Fees received for the project', source: { kind: 'manual', referral: '[rate]', sales: '[rate]' } },
  { line: 'Managed IT and support contracts', basis: 'First-year contract value', source: { kind: 'manual', referral: '[rate]', sales: '[rate]' } },
  { line: 'Web hosting, domains and websites', basis: 'First-year value', source: { kind: 'manual', referral: '[rate]', sales: '[rate]' } },
  { line: 'Digital Archive and document management', basis: 'Build and first-year licence value', source: { kind: 'manual', referral: '[rate]', sales: '[rate]' } },
  { line: 'Products with no GoLive margin', basis: 'Any product on which GoLive earns no margin', source: { kind: 'nomargin' } },
]

export const AUTO_KEYS = new Set(LINES.filter((l) => l.source.kind !== 'manual').map((l) => rowKey(l)))

export type FamilyMargin = {
  /** The margin at least COVERAGE of the line's (non-zero) products earn. The rate is based on this. */
  basis: number | null
  min: number | null
  products: number
  lowest?: string
  /** Products earning less than the basis: commission on them is limited under clause 5.2. */
  below: { title: string; margin: number }[]
  /** Products earning nothing: covered by the no-commission line. */
  zero: string[]
}
export type Margins = { batch: string | null; families: Record<Family, FamilyMargin> }

/** Share of a line's products whose margin the rate must be supported by. */
export const COVERAGE = 0.8
export const nominal = (m: number) => Math.round(m * 200) / 200

/** Pure: the basis margin and exceptions for one line, from each product's lowest margin. */
export function familyMargin(products: { title: string; margin: number }[]): FamilyMargin {
  const byTitle = new Map<string, number>()
  for (const p of products) byTitle.set(p.title, Math.min(byTitle.get(p.title) ?? Infinity, nominal(p.margin)))
  const all = [...byTitle.entries()].map(([title, margin]) => ({ title, margin }))
  const zero = all.filter((p) => p.margin <= 0).map((p) => p.title).sort()
  const paid = all.filter((p) => p.margin > 0).sort((a, b) => a.margin - b.margin)
  if (!paid.length) return { basis: null, min: null, products: 0, below: [], zero }
  const basis = paid[Math.floor((1 - COVERAGE) * (paid.length - 1))].margin
  return {
    basis, min: paid[0].margin, products: paid.length, lowest: paid[0].title,
    below: paid.filter((p) => p.margin < basis), zero,
  }
}
export type Settings = Pick<ICommissionSettings, 'salesShare' | 'referralShare' | 'renewalFactor' | 'odooLevel'>
export type Explain = { line: string; basis: string; auto: boolean; source: string; margin: number | null; sales: string; referral: string; below?: { title: string; margin: number }[] }

export function formatPct(x: number): string {
  const v = Math.round(x * 10000) / 100
  return `${Number(v.toFixed(2))}%`
}

export function rateFor(margin: number, share: number, factor = 1): string {
  const raw = margin * share * factor
  const stepped = Math.floor((raw + 1e-9) / RATE_STEP) * RATE_STEP
  return stepped <= 0 ? 'No commission' : formatPct(stepped)
}

/**
 * Pure: the full schedule from margins, settings and the rates already in use
 * for manual lines (draft first, else published). Lines the MD added that are
 * not in LINES are kept, after the standard lines.
 */
export function buildRows(settings: Settings, margins: Margins, existing: IScheduleRow[]): { rows: IScheduleRow[]; explain: Explain[] } {
  const prior = new Map(existing.map((r) => [rowKey(r), r]))
  const rows: IScheduleRow[] = []
  const explain: Explain[] = []
  for (const l of LINES) {
    const s = l.source
    let sales = '[rate]', referral = '[rate]', margin: number | null = null, source = ''
    let explainBelow: { title: string; margin: number }[] | undefined
    if (s.kind === 'manual') {
      const p = prior.get(rowKey(l))
      sales = p?.sales || s.sales; referral = p?.referral || s.referral
      source = 'Set by you'
    } else if (s.kind === 'nomargin') {
      sales = referral = 'No commission'
      source = 'Rule'
    } else if (s.kind === 'odoo') {
      const m = ODOO_MARGINS[settings.odooLevel]
      if (!m) { sales = referral = NOT_ODOO; source = 'Odoo: not a partner' }
      else {
        margin = s.what === 'licence' ? m.licence : m.hosting
        const f = l.renewal ? settings.renewalFactor : 1
        sales = rateFor(margin, settings.salesShare, f); referral = rateFor(margin, settings.referralShare, f)
        source = `Odoo ${ODOO_LEVEL_LABEL[settings.odooLevel]}: ${s.what === 'licence' ? 'licence' : 'Odoo.sh hosting'} commission`
      }
    } else {
      const fams = s.families.map((f) => margins.families[f]).filter((x): x is FamilyMargin => !!x && typeof x.basis === 'number')
      if (fams.length === s.families.length && fams.length) {
        margin = Math.min(...fams.map((x) => x.basis as number))
        const f = l.renewal ? settings.renewalFactor : 1
        sales = rateFor(margin, settings.salesShare, f); referral = rateFor(margin, settings.referralShare, f)
        const products = fams.reduce((n, x) => n + x.products, 0)
        const below = fams.flatMap((x) => x.below).filter((b) => b.margin < (margin as number))
        source = `4Sight price list${margins.batch ? ` ${margins.batch}` : ''}: ${products - below.length} of ${products} products earn ${formatPct(margin)} or more${below.length ? `; ${below.length} below it limited by clause 5.2` : ''}`
        explainBelow = below
      } else {
        source = 'No 4Sight price list imported yet'
      }
    }
    rows.push({ line: l.line, basis: l.basis, referral, sales })
    explain.push({ line: l.line, basis: l.basis, auto: s.kind !== 'manual', source, margin, sales, referral, below: explainBelow })
  }
  const standard = new Set(LINES.map((l) => rowKey(l)))
  for (const r of existing) if (!standard.has(rowKey(r))) rows.push({ ...r })
  return { rows, explain }
}

/** Pure: published automatic rates now above the chosen share of the current margin. */
export function guardrails(published: IScheduleRow[], built: IScheduleRow[]): string[] {
  const now = new Map(built.map((r) => [rowKey(r), r]))
  const pct = (s: string) => { const m = /^\s*(\d+(?:\.\d+)?)\s*%\s*$/.exec(s || ''); return m ? parseFloat(m[1]) : null }
  const out: string[] = []
  for (const r of published) {
    if (!AUTO_KEYS.has(rowKey(r))) continue
    const n = now.get(rowKey(r)); if (!n) continue
    for (const f of ['sales', 'referral'] as const) {
      const a = pct(r[f]), b = pct(n[f])
      if (a !== null && b !== null && a > b + 1e-9) out.push(`${r.line} (${r.basis}), ${f === 'sales' ? 'Sales' : 'Referral'} Partners: published ${r[f]} is above the ${n[f]} your current margin supports.`)
      if (a !== null && b === null && /no commission|available once/i.test(n[f])) out.push(`${r.line} (${r.basis}), ${f === 'sales' ? 'Sales' : 'Referral'} Partners: published ${r[f]}, but the current margin supports none.`)
    }
  }
  return out
}

/* ---------------------------------------------------------- database side */

export async function getSettings(): Promise<ICommissionSettings> {
  return (await CommissionSettings.findOne({ key: 'partner' })) || (await CommissionSettings.create({ key: 'partner' }))
}

/** Basis margin and exceptions per Microsoft line, from active corporate products in the latest 4Sight list. */
export async function computeMargins(): Promise<Margins> {
  const batchRow = (await PricingCatalog.findOne({ distributor: DISTRIBUTOR, active: true }).sort({ importBatch: -1 }).select('importBatch').lean()) as { importBatch?: string } | null
  const families = {} as Margins['families']
  for (const [k, f] of Object.entries(FAMILIES) as [Family, (typeof FAMILIES)[Family]][]) {
    const q: Record<string, unknown> = { distributor: DISTRIBUTOR, active: true, customerType: 'corporate', retailUSD: { $gt: 0 }, skuTitle: { $regex: f.pattern, $options: 'i' } }
    if (f.exclude) q.$and = [{ skuTitle: { $not: new RegExp(f.exclude, 'i') } }]
    const rows = (await PricingCatalog.find(q).select('skuTitle marginPercent').lean()) as unknown as { skuTitle: string; marginPercent: number }[]
    families[k] = familyMargin(rows.map((r) => ({ title: r.skuTitle, margin: r.marginPercent })))
  }
  return { batch: batchRow?.importBatch || null, families }
}

const resend = new Resend(process.env.RESEND_API_KEY)
const NOTIFY = process.env.PARTNERS_NOTIFY || PARTNER_EMAIL
const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export type RegenResult = { changed: boolean; draftUpdated: boolean; changes: ReturnType<typeof diffRows>; message: string }

/**
 * Recalculate the automatic lines. If they differ from what is published,
 * write them into the draft (creating one if needed, keeping any manual edits
 * in an existing draft) and email the MD. Never publishes.
 */
export async function regenerate(trigger: string, by: string): Promise<RegenResult> {
  const [settings, margins, current, draft] = await Promise.all([getSettings(), computeMargins(), currentSchedule(), CommissionSchedule.findOne({ status: 'draft' })])
  const base = draft ? draft.rows : (current?.rows || [])
  const { rows } = buildRows(settings, margins, base.map((r) => ({ line: r.line, basis: r.basis, referral: r.referral, sales: r.sales })))
  const vsPublished = diffRows(current?.rows || [], rows)
  const vsBase = diffRows(base, rows)

  if (!draft && current && vsPublished.length === 0) {
    return { changed: false, draftUpdated: false, changes: [], message: 'The published rates already match your current margins and settings. No draft was needed.' }
  }
  if (draft && vsBase.length === 0) {
    return { changed: vsPublished.length > 0, draftUpdated: false, changes: vsPublished, message: 'The existing draft already reflects your current margins and settings.' }
  }
  const d = draft || new CommissionSchedule({ status: 'draft', rows: [], summary: '' })
  d.rows = rows
  const note = trigger.startsWith('Pricing catalogue')
    ? `Microsoft rates updated to reflect GoLive\u2019s current Microsoft margins (${DISTRIBUTOR} price list${margins.batch ? ` ${margins.batch}` : ''}).`
    : trigger.startsWith('Odoo') ? `Odoo licence and hosting rates updated for GoLive\u2019s Odoo partnership level (${ODOO_LEVEL_LABEL[settings.odooLevel]}).`
    : 'Rates recalculated.'
  if (!d.summary || /^(Microsoft rates updated|Odoo licence and hosting|Rates recalculated)/.test(d.summary)) d.summary = note
  await d.save()

  const list = vsPublished.map((c) => `<li>${esc(c.kind === 'changed' ? `${c.line} (${c.basis}), ${c.field === 'sales' ? 'Sales' : 'Referral'}: ${c.from} \u2192 ${c.to}` : `${c.kind === 'added' ? 'New' : 'Removed'}: ${c.line} (${c.basis})`)}</li>`).join('')
  try {
    await resend.emails.send({
      from: `GoLive Partner Network <${PARTNER_EMAIL}>`, to: NOTIFY,
      subject: 'Commission schedule draft ready for your review',
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.6;max-width:620px">
        <p>${esc(trigger)} changed the rates the commission rules produce, so a draft has been ${draft ? 'updated' : 'created'}. Nothing has been published and no partner has been told.</p>
        ${list ? `<p><strong>Against the published schedule:</strong></p><ul style="padding-left:20px">${list}</ul>` : ''}
        <p><a href="${PORTAL_URL}/portal/partners/commission" style="display:inline-block;background:#0b7e9b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Review the draft</a></p>
        <p style="font-size:12px;color:#777">Triggered by ${esc(by)}.</p></div>`,
    })
  } catch (e) { console.error('[commission] draft notice failed:', (e as Error).message) }
  return { changed: true, draftUpdated: true, changes: vsPublished, message: `A draft has been ${draft ? 'updated' : 'created'} with ${vsPublished.length} change${vsPublished.length === 1 ? '' : 's'} from the published schedule. Review and publish it when ready.` }
}
