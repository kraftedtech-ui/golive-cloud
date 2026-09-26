import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin, requireRole, forbiddenAction } from '@/lib/apiAuth'
import { OPS_PARTNER_ACTIONS, OPS_STAGES } from '@/lib/roles'
import PartnerApplication, { PARTNER_STAGES, type PartnerStage } from '@/models/PartnerApplication'
import { findConflicts } from '@/lib/partners'
import { STAGE_LABELS } from '@/lib/partnerConfig'
import { closeExpired, trainingState, sendTrainingInvite } from '@/lib/partnerTrainingFlow'
import { sendAgreement, countersign, sendExecutedEmail } from '@/lib/partnerAgreementFlow'
import { agreementMode } from '@/lib/partnerAgreement'
import { currentSchedule } from '@/lib/commissionSchedule'
import { ensureApplicationDeals } from '@/lib/dealRegistration'
import { MD_NAME } from '@/lib/offerConfig'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

async function load(id: string) {
  if (!mongoose.isValidObjectId(id)) return null
  await connectDB()
  return PartnerApplication.findById(id)
}

/** Admin: the full application. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(['admin', 'operations'])
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const app = await load(id)
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (closeExpired(app)) await app.save()
  const cur = await currentSchedule()
  return NextResponse.json({ application: app.toObject(), training: trainingState(app), agreementMode: agreementMode(app.applicant.email, !!cur), currentScheduleVersion: cur?.version ?? null })
}

/**
 * Admin actions, each recorded on the timeline with who did it:
 *   { action: 'stage', status, note }          move through accreditation
 *   { action: 'account', accountId, decision, note, force? }  register or refuse a named account;
 *        force: true overrides a customer or pipeline match (never another partner's registration)
 *   { action: 'notes', notes }                 private MD notes
 *   { action: 'recheck' }                      re-run the conflict check on every account
 *   { action: 'sendTraining' }                 email (or re-email) the personal training link
 *   { action: 'grantAttempt', note }           one more partner assessment attempt, without the 7-day wait
 *   { action: 'sendAgreement' }                email the agreement to sign (after the assessment is passed)
 *   { action: 'countersign' }                  execute it: mints GL-PTR and GL-CERT numbers, activates, emails documents
 *   { action: 'resendDocuments' }              re-email the executed agreement and certificate links
 *   { action: 'revokeCertificate', note }      revoke the certificate (the verify page shows it as revoked)
 * Moving an applicant to the Training stage sends the training link automatically.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(['admin', 'operations'])
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const app = await load(id)
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  const by = auth.email || auth.name || 'admin'
  const note = String(body.note || '').trim().slice(0, 1000) || undefined
  const now = new Date()

  // Operations manages partners but never signs, approves or decides (lib/roles.ts).
  if (auth.role !== 'admin') {
    const act = String(body.action || '')
    if (!(OPS_PARTNER_ACTIONS as readonly string[]).includes(act)) return forbiddenAction('take this action on a partner application')
    if (act === 'stage' && !(OPS_STAGES as readonly string[]).includes(String(body.status || ''))) return forbiddenAction('move an applicant to that stage')
  }
  switch (body.action) {
    case 'stage': {
      const status = String(body.status || '') as PartnerStage
      if (!PARTNER_STAGES.includes(status)) return NextResponse.json({ error: 'Unknown stage' }, { status: 400 })
      if (status === 'active' && !app.partnerNumber) {
        return NextResponse.json({ error: 'A partner becomes active at countersignature of the partner agreement, which mints their GL-PTR number. That step arrives with the agreement stage.' }, { status: 409 })
      }
      if (status === app.status) return NextResponse.json({ application: app.toObject() })
      const from = app.status
      app.status = status
      app.timeline.push({ at: now, by, action: `Stage: ${STAGE_LABELS[from] || from} to ${STAGE_LABELS[status] || status}`, note })
      // Agreement clause 9: termination revokes the certificate automatically.
      if ((status === 'declined' || status === 'withdrawn') && app.certificate?.number && !app.certificate.revokedAt) {
        app.certificate.revokedAt = now
        app.certificate.revokedBy = by
        app.certificate.revokeReason = `Appointment ended (moved to ${STAGE_LABELS[status]})${note ? `: ${note}` : ''}`
        app.markModified('certificate')
        app.timeline.push({ at: now, by: 'system', action: `Certificate ${app.certificate.number} revoked automatically on termination` })
      }
      if (status === 'training' && !app.training?.invitedAt) {
        const sent = await sendTrainingInvite(app, now)
        app.timeline.push({ at: now, by: 'system', action: sent.ok ? `Training link emailed to ${app.applicant.email}` : 'Training link email FAILED', note: sent.ok ? undefined : sent.error })
      }
      break
    }
    case 'sendTraining': {
      if (!['training', 'assessment', 'agreement', 'active'].includes(app.status)) {
        return NextResponse.json({ error: 'Move the applicant to the Training stage first.' }, { status: 409 })
      }
      const sent = await sendTrainingInvite(app, now)
      if (!sent.ok) return NextResponse.json({ error: `The email could not be sent: ${sent.error}` }, { status: 502 })
      app.timeline.push({ at: now, by, action: `Training link emailed to ${app.applicant.email}` })
      break
    }
    case 'sendAgreement': {
      const r = await sendAgreement(app, by, now)
      if (!r.ok) {
        if (r.status) return NextResponse.json({ error: r.error }, { status: r.status })
        return NextResponse.json({ error: `The email could not be sent: ${r.error}` }, { status: 502 })
      }
      break
    }
    case 'countersign': {
      const mdIp = (req.headers.get('cf-connecting-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0] || req.headers.get('x-real-ip') || '').trim() || undefined
      const r = await countersign(app, auth.name || MD_NAME, by, now, mdIp)
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status || 409 })
      await app.save()
      const created = await ensureApplicationDeals(app, by)
      if (created) app.timeline.push({ at: new Date(), by: 'system', action: `${created} account${created === 1 ? '' : 's'} registered during the application became live deal registrations` })
      const mail = await sendExecutedEmail(app)
      app.timeline.push({ at: new Date(), by: 'system', action: mail.ok ? `Certificate and signed agreement emailed to ${app.applicant.email}` : 'Certificate email FAILED', note: mail.ok ? undefined : mail.error })
      break
    }
    case 'resendDocuments': {
      if (!app.certificate?.number || !app.agreement?.mdSignedAt) return NextResponse.json({ error: 'Nothing has been issued yet.' }, { status: 409 })
      if (app.certificate.revokedAt) return NextResponse.json({ error: 'The certificate is revoked.' }, { status: 409 })
      const mail = await sendExecutedEmail(app)
      if (!mail.ok) return NextResponse.json({ error: `The email could not be sent: ${mail.error}` }, { status: 502 })
      app.timeline.push({ at: now, by, action: `Certificate and signed agreement re-sent to ${app.applicant.email}` })
      break
    }
    case 'revokeCertificate': {
      if (!app.certificate?.number) return NextResponse.json({ error: 'No certificate has been issued.' }, { status: 409 })
      if (app.certificate.revokedAt) return NextResponse.json({ error: 'Already revoked.' }, { status: 409 })
      if (!note) return NextResponse.json({ error: 'Give a reason for the record. It is never shown publicly.' }, { status: 400 })
      app.certificate.revokedAt = now
      app.certificate.revokedBy = by
      app.certificate.revokeReason = note
      app.markModified('certificate')
      app.timeline.push({ at: now, by, action: `Certificate ${app.certificate.number} revoked`, note })
      break
    }
    case 'grantAttempt': {
      app.extraFinalAttempts = (app.extraFinalAttempts || 0) + 1
      app.finalWaitWaivedAt = now
      app.timeline.push({ at: now, by, action: 'Extra partner assessment attempt granted, without the 7-day wait', note })
      break
    }
    case 'account': {
      const decision = String(body.decision || '')
      if (!['registered', 'refused', 'pending'].includes(decision)) return NextResponse.json({ error: 'Unknown decision' }, { status: 400 })
      const acc = app.namedAccounts.find((a) => String((a as unknown as { _id: unknown })._id) === String(body.accountId))
      if (!acc) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      if (decision === 'registered') {
        // Re-check at the moment of decision: another partner may have been
        // registered to the same organisation since this application arrived.
        const [fresh] = await findConflicts([acc.organisation], id)
        acc.conflict = fresh
        if (fresh && fresh.kind === 'partner') {
          await app.save()
          return NextResponse.json({ error: `Already registered to ${fresh.owner}. Refuse it here, or release it on that application first.` }, { status: 409 })
        }
        // Customers and an employee's pipeline take precedence (Partner Programme
        // Framework, section 7). The MD may still override a match he judges to be
        // a different organisation, but only deliberately, and it is recorded.
        if (fresh && body.force !== true) {
          await app.save()
          const what = fresh.kind === 'customer' ? 'an existing customer' : `a pipeline lead${fresh.owner ? ` held by ${fresh.owner}` : ''}`
          return NextResponse.json({ error: `${acc.organisation} matches ${what} (${fresh.match}).`, needsConfirm: true }, { status: 409 })
        }
      }
      acc.decision = decision as 'registered' | 'refused' | 'pending'
      acc.decisionNote = note
      acc.decidedAt = now
      acc.decidedBy = by
      app.markModified('namedAccounts')
      app.timeline.push({ at: now, by, action: `Named account ${decision}: ${acc.organisation}${decision === 'registered' && acc.conflict ? ` (override: matched ${acc.conflict.match})` : ''}`, note })
      break
    }
    case 'notes': {
      app.notes = String(body.notes || '').slice(0, 5000)
      break
    }
    case 'recheck': {
      const fresh = await findConflicts(app.namedAccounts.map((a) => a.organisation), id)
      app.namedAccounts.forEach((a, i) => { a.conflict = fresh[i] })
      app.markModified('namedAccounts')
      app.timeline.push({ at: now, by, action: 'Conflict check re-run', note: `${fresh.filter(Boolean).length} conflict(s)` })
      break
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
  await app.save()
  const cur = await currentSchedule()
  return NextResponse.json({ application: app.toObject(), training: trainingState(app), agreementMode: agreementMode(app.applicant.email, !!cur), currentScheduleVersion: cur?.version ?? null })
}

/**
 * Admin: permanently delete an application and its deal registrations. For
 * test records only: the reference must be typed to confirm, and it is
 * refused if any registration has been won (commission may be owed).
 * Its partner and certificate numbers become free again for reuse.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const app = await load(id)
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const confirm = req.nextUrl.searchParams.get('confirm') || ''
  if (confirm.trim().toUpperCase() !== app.ref.toUpperCase()) {
    return NextResponse.json({ error: `Type the reference ${app.ref} exactly to confirm deletion.` }, { status: 400 })
  }
  const { default: DealRegistration } = await import('@/models/DealRegistration')
  const { default: PartnerCommission } = await import('@/models/PartnerCommission')
  const { default: WhmcsInvoiceEvent } = await import('@/models/WhmcsInvoiceEvent')
  // Money actually paid to the partner is a real payout: that record must stay.
  const paid = await PartnerCommission.countDocuments({ partnerApplication: app._id, status: 'paid' })
  if (paid) return NextResponse.json({ error: `Commission has been paid to this partner (${paid} line${paid === 1 ? '' : 's'}), so the record cannot be deleted. Withdraw it instead.` }, { status: 409 })
  const dealIds = (await DealRegistration.find({ partnerApplication: app._id }).select('_id').lean()).map((d) => d._id)
  const lines = await PartnerCommission.deleteMany({ partnerApplication: app._id })
  const events = await WhmcsInvoiceEvent.deleteMany({ deal: { $in: dealIds } })
  const deals = await DealRegistration.deleteMany({ partnerApplication: app._id })
  await app.deleteOne()
  console.warn(`[partners] ${auth.email || auth.name} deleted ${app.ref} (${app.applicant.name}, ${app.partnerNumber || 'no partner number'}, ${app.certificate?.number || 'no certificate'}), ${deals.deletedCount} deal registration(s), ${lines.deletedCount} unpaid commission line(s), ${events.deletedCount} billing event(s)`)
  return NextResponse.json({ ok: true, deletedDeals: deals.deletedCount, deletedCommission: lines.deletedCount })
}
