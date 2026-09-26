/**
 * dealRegistration.ts: partner deal registration rules (agreement clause 4).
 * SERVER ONLY.
 *
 *   approve         valid 90 days; schedule version locked; hard limit 180 days
 *   milestone       recorded by GoLive only: valid until 60 days after it,
 *                   capped at the hard limit; partner-logged activity never extends
 *   extend          the MD agrees a later hard limit in writing (reason required)
 *   lapse           automatic once validUntil passes without a close
 *   won / lost      closed; validAtClose decides first-year commission eligibility
 */

import { Resend } from 'resend'
import DealRegistration, { type IDealRegistration, type MilestoneKind } from '@/models/DealRegistration'
import PartnerApplication, { type IPartnerApplication } from '@/models/PartnerApplication'
import { findConflicts, normaliseOrg } from '@/lib/partners'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'
import { PORTAL_URL, COMPANY, COMPANY_RC } from '@/lib/offerConfig'

export const DAY = 864e5
export const INITIAL_DAYS = 90
export const MILESTONE_DAYS = 60
export const LIMIT_DAYS = 180

export const MILESTONE_LABEL: Record<MilestoneKind, string> = {
  meeting: 'Meeting with the prospect attended by GoLive',
  quotation: 'Quotation or proposal issued by GoLive',
  written_confirmation: 'Prospect\u2019s written confirmation of interest to GoLive',
}
export const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting approval', active: 'Registered', lapsed: 'Lapsed', refused: 'Not accepted',
  won: 'Won', lost: 'Lost', released: 'Released',
}

export async function nextDealRef(now = new Date()): Promise<string> {
  const prefix = `GL-DR-${now.getFullYear()}-`
  const refs = (await DealRegistration.distinct('ref', { ref: { $regex: `^${prefix}` } })) as string[]
  const max = refs.reduce((m, r) => Math.max(m, parseInt(r.slice(prefix.length), 10) || 0), 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY)

/** Pure: validity after approval and any milestones, capped at the hard limit. */
export function computeValidity(approvedAt: Date, milestones: { at: Date }[], hardLimit?: Date): { validUntil: Date; hardLimit: Date } {
  const limit = hardLimit || addDays(approvedAt, LIMIT_DAYS)
  let until = addDays(approvedAt, INITIAL_DAYS)
  for (const m of milestones) {
    const c = addDays(new Date(m.at), MILESTONE_DAYS)
    if (c > until) until = c
  }
  if (until > limit) until = limit
  return { validUntil: until, hardLimit: limit }
}

/** Marks an active registration lapsed once its validity has passed. Returns true if it changed. */
export function refreshLapse(d: IDealRegistration, now = new Date()): boolean {
  if (d.status === 'active' && d.validUntil && now.getTime() > new Date(d.validUntil).getTime()) {
    d.status = 'lapsed'
    d.timeline.push({ at: now, by: 'system', action: 'Registration lapsed', note: `Valid until ${new Date(d.validUntil).toISOString().slice(0, 10)}; no close by then` })
    return true
  }
  return false
}

export type DealConflict = { kind: 'customer' | 'lead' | 'partner'; match: string; owner?: string } | null

/**
 * Customers and employees' pipeline (via findConflicts), plus other partners'
 * pending or live registrations. First valid registration takes precedence.
 */
export async function dealConflict(organisation: string, partnerNumber: string, excludeId?: string): Promise<DealConflict> {
  const [base] = await findConflicts([organisation])
  if (base && base.kind !== 'partner') return base
  const n = normaliseOrg(organisation)
  const others = (await DealRegistration.find({
    partnerNumber: { $ne: partnerNumber }, status: { $in: ['pending', 'active'] },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select('organisation partnerName partnerNumber ref status').lean()) as unknown as { organisation: string; partnerName: string; partnerNumber: string; ref: string; status: string }[]
  const hit = others.find((o) => {
    const m = normaliseOrg(o.organisation)
    if (!m || !n) return false
    if (m === n) return true
    const [short, long] = m.length <= n.length ? [m, n] : [n, m]
    return short.length >= 5 && (long.startsWith(short + ' ') || long.includes(' ' + short + ' ') || long.endsWith(' ' + short))
  })
  if (hit) return { kind: 'partner', match: hit.organisation, owner: `${hit.partnerName} (${hit.partnerNumber}, ${hit.status === 'pending' ? 'awaiting approval' : 'registered'})` }
  return base
}

/**
 * Accounts the MD registered to a partner during their application become
 * live registrations from appointment. Idempotent.
 */
export async function ensureApplicationDeals(app: IPartnerApplication, by = 'system'): Promise<number> {
  if (!app.partnerNumber || app.status !== 'active') return 0
  const accounts = (app.namedAccounts || []).filter((a) => a.decision === 'registered')
  if (!accounts.length) return 0
  const existing = new Set((await DealRegistration.find({ partnerApplication: app._id, source: 'application' }).select('sourceAccountId').lean()).map((d) => String((d as { sourceAccountId?: string }).sourceAccountId)))
  const approvedAt = app.agreement?.mdSignedAt ? new Date(app.agreement.mdSignedAt) : new Date()
  let created = 0
  for (const a of accounts) {
    const id = String((a as unknown as { _id: unknown })._id)
    if (existing.has(id)) continue
    const v = computeValidity(approvedAt, [])
    await DealRegistration.create({
      ref: await nextDealRef(), partnerApplication: app._id, partnerNumber: app.partnerNumber, partnerName: app.applicant.name,
      partnerEmail: app.applicant.email, category: app.category, source: 'application', sourceAccountId: id,
      organisation: a.organisation, sector: a.sector, contactName: a.contactName, contactRole: a.contactRole,
      requirement: a.requirement, expectedClose: a.timing, status: 'active', conflict: a.conflict || null,
      submittedAt: app.createdAt, approvedAt, approvedBy: a.decidedBy || by, scheduleVersion: app.agreement?.scheduleVersion,
      validUntil: v.validUntil, hardLimit: v.hardLimit, milestones: [],
      timeline: [{ at: new Date(), by, action: 'Registered from the partner application', note: `Approved during the application by ${a.decidedBy || 'the MD'}; valid from appointment` }],
    })
    created++
  }
  return created
}

/* ------------------------------------------------------------------ emails */

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `GoLive Partner Network <${PARTNER_EMAIL}>`
const NOTIFY = process.env.PARTNERS_NOTIFY || PARTNER_EMAIL
const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const first = (n: string) => (n || '').trim().split(/\s+/)[0] || 'there'
const fmt = (d?: Date) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' }) : '')

async function send(to: string, subject: string, html: string) {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, reply_to: PARTNER_EMAIL, subject, html })
    if (error) console.error('[deal-registration] email failed:', error.message || error)
  } catch (e) { console.error('[deal-registration] email failed:', (e as Error).message) }
}
const shell = (inner: string) => `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:620px;margin:0 auto">${inner}
  <p style="margin-bottom:2px;margin-top:22px">Yours sincerely,</p>
  <p style="margin-top:0"><strong style="color:#0e7c86">GoLive Partner Network</strong><br>${esc(COMPANY)}<br><span style="font-size:12px;color:#777">${esc(COMPANY_RC)}</span></p></div>`

export function notifyNewRegistration(d: IDealRegistration) {
  return send(NOTIFY, `Deal registration to review: ${d.organisation} (${d.partnerName})`, `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.6;max-width:620px">
  <p><strong>${esc(d.partnerName)}</strong> (${esc(d.partnerNumber)}) has registered <strong>${esc(d.organisation)}</strong>${d.lineOfBusiness ? ` for ${esc(d.lineOfBusiness)}` : ''}. Reference ${esc(d.ref)}.</p>
  ${d.conflict ? `<p style="color:#b42318;font-weight:600">Conflict: ${d.conflict.kind === 'customer' ? 'existing customer' : d.conflict.kind === 'lead' ? 'in the sales pipeline' : 'another partner'} (${esc(d.conflict.match)}${d.conflict.owner ? `, ${esc(d.conflict.owner)}` : ''})</p>` : ''}
  <p><a href="${PORTAL_URL}/portal/partners/deals" style="display:inline-block;background:#0b7e9b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Review in the portal</a></p></div>`)
}

export function notifyDecision(d: IDealRegistration) {
  if (d.status === 'active') {
    return send(d.partnerEmail, `Registration approved: ${d.organisation}`, shell(`
      <p>Dear ${esc(first(d.partnerName))},</p>
      <p>Your registration of <strong>${esc(d.organisation)}</strong> (${esc(d.ref)}) has been approved. It is held for you until <strong>${esc(fmt(d.validUntil))}</strong>${d.scheduleVersion ? `, and first-year commission on it is locked to commission schedule version ${d.scheduleVersion}` : ''}.</p>
      <p>It is extended when GoLive records a milestone: a meeting GoLive attends, a GoLive quotation or proposal, or the prospect&rsquo;s written confirmation to GoLive. Please involve GoLive early; activity you record alone does not extend a registration.</p>
      <p><a href="${PORTAL_URL}/partner" style="color:#0b7e9b">Open your partner dashboard</a></p>`))
  }
  return send(d.partnerEmail, `Registration not accepted: ${d.organisation}`, shell(`
    <p>Dear ${esc(first(d.partnerName))},</p>
    <p>Your registration of <strong>${esc(d.organisation)}</strong> (${esc(d.ref)}) has not been accepted${d.decisionNote ? `: ${esc(d.decisionNote)}` : '.'}</p>
    <p>Existing GoLive customers, prospects already in a GoLive employee&rsquo;s pipeline, and prospects already registered to another partner cannot be registered. Please do not approach this organisation on GoLive&rsquo;s behalf.</p>`))
}

export function notifyMilestone(d: IDealRegistration, kind: MilestoneKind) {
  return send(d.partnerEmail, `Registration extended: ${d.organisation}`, shell(`
    <p>Dear ${esc(first(d.partnerName))},</p>
    <p>GoLive has recorded a milestone on <strong>${esc(d.organisation)}</strong> (${esc(d.ref)}): ${esc(MILESTONE_LABEL[kind].toLowerCase())}. The registration is now held until <strong>${esc(fmt(d.validUntil))}</strong>.</p>`))
}

export async function partnerForDeal(d: IDealRegistration) {
  return PartnerApplication.findById(d.partnerApplication)
}
