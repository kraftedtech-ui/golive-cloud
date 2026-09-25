/**
 * commissionSchedule.ts: the versioned partner commission schedule. SERVER ONLY.
 *
 * Rules (decided September 2026, reflected in agreement clauses 4.2 and 5.5):
 * - The MD may change rates at any time; a new version is effective the
 *   moment it is published, with no notice period.
 * - Each registered prospect carries the version in force when it was
 *   registered, for first-year commission, while its registration is valid.
 * - Renewal commission is paid at the version in force at each renewal.
 * - Every partner is emailed what changed, and each change is kept for ever.
 */

import { Resend } from 'resend'
import CommissionSchedule, { type IScheduleRow, type IScheduleChange, type ICommissionSchedule } from '@/models/CommissionSchedule'
import PartnerApplication from '@/models/PartnerApplication'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'
import { COMPANY, COMPANY_RC } from '@/lib/offerConfig'

export const rowKey = (r: { line: string; basis: string }) => `${r.line.trim().toLowerCase()}|${r.basis.trim().toLowerCase()}`

export function cleanRows(rows: unknown): IScheduleRow[] {
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => ({
      line: String((r as IScheduleRow)?.line || '').trim().slice(0, 160),
      basis: String((r as IScheduleRow)?.basis || '').trim().slice(0, 240),
      referral: String((r as IScheduleRow)?.referral || '').trim().slice(0, 240),
      sales: String((r as IScheduleRow)?.sales || '').trim().slice(0, 240),
    }))
    .filter((r) => r.line)
    .slice(0, 60)
}

/** Problems that stop a schedule being published. Empty when it is ready. */
export function publishProblems(rows: IScheduleRow[]): string[] {
  const out: string[] = []
  if (!rows.length) out.push('The schedule has no lines.')
  const seen = new Set<string>()
  for (const r of rows) {
    if (!r.basis) out.push(`"${r.line}" has no basis.`)
    if (!r.referral || !r.sales) out.push(`"${r.line}" (${r.basis || 'no basis'}) is missing a rate for ${!r.referral && !r.sales ? 'both categories' : !r.referral ? 'Referral Partners' : 'Sales Partners'}.`)
    if (/\[rate\]/i.test(r.referral + r.sales)) out.push(`"${r.line}" (${r.basis}) still contains a [rate] placeholder.`)
    const k = rowKey(r)
    if (seen.has(k)) out.push(`"${r.line}" with basis "${r.basis}" appears twice.`)
    seen.add(k)
  }
  return out
}

/** What changed between two versions, line by line. Lines are matched on line + basis. */
export function diffRows(prev: IScheduleRow[], next: IScheduleRow[]): IScheduleChange[] {
  const out: IScheduleChange[] = []
  const before = new Map(prev.map((r) => [rowKey(r), r]))
  const after = new Map(next.map((r) => [rowKey(r), r]))
  for (const r of next) {
    const p = before.get(rowKey(r))
    if (!p) { out.push({ kind: 'added', line: r.line, basis: r.basis }); continue }
    for (const f of ['referral', 'sales'] as const) {
      if (p[f].trim() !== r[f].trim()) out.push({ kind: 'changed', line: r.line, basis: r.basis, field: f, from: p[f], to: r[f] })
    }
  }
  for (const p of prev) if (!after.has(rowKey(p))) out.push({ kind: 'removed', line: p.line, basis: p.basis })
  return out
}

export async function currentSchedule(): Promise<ICommissionSchedule | null> {
  return CommissionSchedule.findOne({ status: 'published' }).sort({ version: -1 })
}

/* ------------------------------------------------------------------ emails */

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `GoLive Partner Network <${PARTNER_EMAIL}>`
const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const first = (name: string) => (name || '').trim().split(/\s+/)[0] || 'there'
const fmtDateTime = (d: Date) => d.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }) + ' WAT'

export function changeLines(changes: IScheduleChange[], category: 'referral' | 'sales'): string[] {
  const who = category === 'sales' ? 'sales' : 'referral'
  return changes
    .filter((c) => c.kind !== 'changed' || c.field === who)
    .map((c) => c.kind === 'added' ? `New: ${c.line} (${c.basis})`
      : c.kind === 'removed' ? `Removed: ${c.line} (${c.basis})`
      : `${c.line} (${c.basis}): ${c.from} changes to ${c.to}`)
}

function updateEmail(name: string, category: 'referral' | 'sales', s: ICommissionSchedule): string {
  const lines = changeLines(s.changes, category)
  const rows = s.rows.map((r) => `<tr><td style="padding:6px 8px;border:1px solid #dfe5e7">${esc(r.line)}</td><td style="padding:6px 8px;border:1px solid #dfe5e7;color:#555">${esc(r.basis)}</td><td style="padding:6px 8px;border:1px solid #dfe5e7;font-weight:600">${esc(category === 'sales' ? r.sales : r.referral)}</td></tr>`).join('')
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.6;max-width:640px;margin:0 auto">
  <p>Dear ${esc(first(name))},</p>
  <p>GoLive has published <strong>version ${s.version}</strong> of the partner commission schedule, effective <strong>${esc(fmtDateTime(s.effectiveAt as Date))}</strong>.</p>
  ${s.summary ? `<p style="background:#f3f8f9;border-left:3px solid #0e7c86;padding:8px 12px">${esc(s.summary)}</p>` : ''}
  <p><strong>What changed for ${category === 'sales' ? 'Sales' : 'Referral'} Partners</strong></p>
  ${lines.length ? `<ul style="padding-left:20px;margin:0 0 12px">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '<p>No rate in your category changed in this version.</p>'}
  <p><strong>How this affects you</strong></p>
  <ul style="padding-left:20px;margin:0 0 12px">
    <li>Prospects you registered before this version keep the rates in force when you registered them, for first-year commission, while their registration stays valid.</li>
    <li>Prospects you register from now on carry these rates.</li>
    <li>Renewal commission is paid at the rates in force at each renewal.</li>
  </ul>
  <p><strong>The full schedule for ${category === 'sales' ? 'Sales' : 'Referral'} Partners, version ${s.version}</strong></p>
  <table style="border-collapse:collapse;font-size:13px;width:100%">${rows}</table>
  <p style="font-size:13px;color:#555;margin-top:14px">Please keep this email as your record. Questions to ${PARTNER_EMAIL}.</p>
  <p style="margin-bottom:2px">Yours sincerely,</p>
  <p style="margin-top:0"><strong style="color:#0e7c86">GoLive Partner Network</strong><br>${esc(COMPANY)}<br><span style="font-size:12px;color:#777">${esc(COMPANY_RC)}</span></p>
</div>`
}

/**
 * Publish the draft: number it, stamp it effective now, record what changed,
 * email every partner who holds or is about to sign an agreement, and put the
 * change on each of their timelines.
 */
export async function publishDraft(by: string, now = new Date()): Promise<{ ok: boolean; status?: number; error?: string; problems?: string[]; schedule?: ICommissionSchedule; pendingAgreements?: number }> {
  const draft = await CommissionSchedule.findOne({ status: 'draft' })
  if (!draft) return { ok: false, status: 404, error: 'There is no draft to publish.' }
  const problems = publishProblems(draft.rows)
  if (problems.length) return { ok: false, status: 400, error: 'The draft is not ready to publish.', problems }
  const prev = await currentSchedule()
  const changes = diffRows(prev?.rows || [], draft.rows)
  if (prev && changes.length === 0) return { ok: false, status: 400, error: 'Nothing has changed from the current version.' }

  draft.version = (prev?.version || 0) + 1
  draft.status = 'published'
  draft.effectiveAt = now
  draft.publishedBy = by
  draft.changes = changes
  await draft.save()

  // Partners holding an executed agreement are told. Applicants with an
  // agreement sent but not signed are counted, so the MD can resend it.
  const partners = await PartnerApplication.find({ status: 'active', 'agreement.mdSignedAt': { $exists: true } })
  let sent = 0, failed = 0
  if (prev) {
    for (const p of partners) {
      try {
        const { error } = await resend.emails.send({
          from: FROM, to: p.applicant.email, reply_to: PARTNER_EMAIL,
          subject: `Commission schedule updated: version ${draft.version}`,
          html: updateEmail(p.applicant.name, p.category, draft),
        })
        if (error) throw new Error(String(error.message || error))
        sent++
        p.timeline.push({ at: now, by: 'system', action: `Commission schedule version ${draft.version} published and emailed`, note: changeLines(changes, p.category).join('; ') || 'No change in this category' })
      } catch (e) {
        failed++
        p.timeline.push({ at: now, by: 'system', action: `Commission schedule version ${draft.version} email FAILED`, note: (e as Error).message })
      }
      await p.save()
    }
  }
  draft.notified = { sent, failed }
  await draft.save()
  const pendingAgreements = await PartnerApplication.countDocuments({ 'agreement.sentAt': { $exists: true }, 'agreement.partnerSignedAt': { $exists: false }, status: { $nin: ['declined', 'withdrawn'] } })
  return { ok: true, schedule: draft, pendingAgreements }
}
