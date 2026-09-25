/**
 * partners.ts: server-side helpers for the GoLive Partner Network.
 *
 * - nextApplicationRef(): GL-PTR-APP-YYYY-NNNN, sequential per year.
 * - findConflicts(): checks the organisations a partner lists against existing
 *   customers, the sales pipeline, and accounts already registered to other
 *   partners. Employee pipeline takes precedence over a partner's claim, as
 *   the Partner Programme Framework sets out, so a match is flagged for the
 *   Managing Director rather than silently accepted.
 * - emails to the applicant and to partners@.
 */

import { Resend } from 'resend'
import PartnerApplication from '@/models/PartnerApplication'
import { Customer } from '@/models/Customer'
import { Lead } from '@/models/Lead'
import { PORTAL_URL, COMPANY, COMPANY_RC } from '@/lib/offerConfig'
import { PARTNER_EMAIL, CATEGORY_INFO } from '@/lib/partnerConfig'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `GoLive Partner Network <${PARTNER_EMAIL}>`
const NOTIFY = process.env.PARTNERS_NOTIFY || PARTNER_EMAIL

export async function nextApplicationRef(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `GL-PTR-APP-${year}-`
  const refs = (await PartnerApplication.distinct('ref', { ref: { $regex: `^${prefix}` } })) as string[]
  const max = refs.reduce((m, r) => Math.max(m, parseInt(r.slice(prefix.length), 10) || 0), 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

/** Company names reduced to a comparable core: case, punctuation and legal suffixes removed. */
export function normaliseOrg(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(the|plc|ltd|limited|llc|inc|company|co|nigeria|nig|group|holdings)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sameOrg(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  return short.length >= 5 && (long.startsWith(short + ' ') || long.includes(' ' + short + ' ') || long.endsWith(' ' + short))
}

export type Conflict = { kind: 'customer' | 'lead' | 'partner'; match: string; owner?: string } | null

export async function findConflicts(orgs: string[], excludeApplicationId?: string): Promise<Conflict[]> {
  type Co = { company: string }
  type Ld = { company: string; assignedTo?: string; assignedToEmail?: string }
  type Pa = { ref: string; applicant: { name: string }; namedAccounts: { organisation: string; decision?: string }[] }
  const [customersRaw, leadsRaw, partnerAppsRaw] = await Promise.all([
    Customer.find({}, 'company').lean().exec(),
    Lead.find({ status: { $ne: 'lost' } }, 'company assignedTo assignedToEmail').lean().exec(),
    PartnerApplication.find(
      { 'namedAccounts.decision': 'registered', status: { $nin: ['declined', 'withdrawn'] }, ...(excludeApplicationId ? { _id: { $ne: excludeApplicationId } } : {}) },
      'ref applicant.name namedAccounts'
    ).lean().exec(),
  ])
  const customers = customersRaw as unknown as Co[]
  const leads = leadsRaw as unknown as Ld[]
  const partnerApps = partnerAppsRaw as unknown as Pa[]
  const cust = customers.map((c) => ({ n: normaliseOrg(c.company), raw: c.company }))
  const lds = leads.map((l) => ({ n: normaliseOrg(l.company), raw: l.company, owner: l.assignedToEmail || l.assignedTo }))
  const regs = partnerApps.flatMap((p) =>
    p.namedAccounts.filter((a) => a.decision === 'registered').map((a) => ({ n: normaliseOrg(a.organisation), raw: a.organisation, owner: `${p.applicant.name} (${p.ref})` }))
  )

  return orgs.map((org) => {
    const n = normaliseOrg(org)
    const c = cust.find((x) => sameOrg(n, x.n))
    if (c) return { kind: 'customer', match: c.raw }
    const l = lds.find((x) => sameOrg(n, x.n))
    if (l) return { kind: 'lead', match: l.raw, owner: l.owner }
    const r = regs.find((x) => sameOrg(n, x.n))
    if (r) return { kind: 'partner', match: r.raw, owner: r.owner }
    return null
  })
}

const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const first = (name: string) => (name || '').trim().split(/\s+/)[0] || 'there'

type Send = { ok: boolean; error?: string }
async function send(to: string, subject: string, html: string): Promise<Send> {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, reply_to: PARTNER_EMAIL, subject, html })
    if (error) return { ok: false, error: String(error.message || error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || 'send failed' }
  }
}

const shell = (inner: string) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">
  ${inner}
  <p style="margin-bottom:2px;margin-top:22px">Yours sincerely,</p>
  <p style="margin-top:0"><strong style="color:#0e7c86">GoLive Partner Network</strong><br>
  ${esc(COMPANY)}<br><span style="font-size:12px;color:#777">${esc(COMPANY_RC)}</span></p>
</div>`

export function sendPartnerApplicationReceived(a: { name: string; email: string; ref: string; category: 'referral' | 'sales' }): Promise<Send> {
  return send(a.email, `Your GoLive Partner Network application (${a.ref})`, shell(`
    <p>Dear ${esc(first(a.name))},</p>
    <p>Thank you for applying to join the GoLive Partner Network as a <strong>${esc(CATEGORY_INFO[a.category].label)}</strong>. Your application reference is <strong>${esc(a.ref)}</strong>. Please quote it in any correspondence.</p>
    <p>What happens next:</p>
    <ol style="padding-left:20px;margin:0 0 12px">
      <li>We review your application, including the organisations you listed, within five working days.</li>
      <li>If it is taken forward, you are invited to a short conversation with the Managing Director.</li>
      <li>You then complete the partner training and assessment online, followed by the partner agreement.</li>
    </ol>
    <p style="font-size:13px;color:#555">Please do not approach the organisations you listed on GoLive's behalf until you have been appointed and those accounts have been confirmed as registered to you. Submitting an application creates no appointment or authority.</p>
    <p style="font-size:13px;color:#555">Questions can be sent to <a href="mailto:${PARTNER_EMAIL}" style="color:#0b7e9b">${PARTNER_EMAIL}</a>.</p>
  `))
}

export function sendPartnerApplicationNotice(a: {
  name: string; email: string; phone: string; ref: string; category: 'referral' | 'sales'
  accounts: { organisation: string; conflict: Conflict }[]; flags: string[]
}): Promise<Send> {
  const conflicts = a.accounts.filter((x) => x.conflict)
  const list = a.accounts.map((x) =>
    `<li>${esc(x.organisation)}${x.conflict ? ` <span style="color:#b42318;font-weight:600">(matches ${x.conflict.kind === 'customer' ? 'existing customer' : x.conflict.kind === 'lead' ? 'pipeline lead' : 'another partner'}: ${esc(x.conflict.match)})</span>` : ''}</li>`).join('')
  return send(NOTIFY, `New partner application: ${a.name} (${a.ref})`, `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.6;max-width:620px">
  <p style="margin:0 0 12px"><strong>${esc(a.name)}</strong> has applied as a <strong>${esc(CATEGORY_INFO[a.category].label)}</strong>. Email address verified at submission.</p>
  <p style="margin:0 0 4px">Reference: <strong>${esc(a.ref)}</strong><br>Email: ${esc(a.email)}<br>Phone: ${esc(a.phone)}</p>
  ${a.flags.length ? `<p style="margin:12px 0 4px;color:#b42318;font-weight:600">Declarations answered Yes: ${a.flags.map(esc).join('; ')}</p>` : ''}
  <p style="margin:12px 0 4px"><strong>Named accounts (${a.accounts.length})</strong>${conflicts.length ? `, <span style="color:#b42318">${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'}</span>` : ''}</p>
  <ul style="margin:0;padding-left:20px">${list || '<li>None listed</li>'}</ul>
  <p style="margin:16px 0"><a href="${PORTAL_URL}/portal/partners" style="display:inline-block;background:#0b7e9b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Review in the portal</a></p>
</div>`)
}
