import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import PartnerApplication, { PARTNER_STAGES, type PartnerStage } from '@/models/PartnerApplication'
import { findConflicts } from '@/lib/partners'
import { STAGE_LABELS } from '@/lib/partnerConfig'
import { closeExpired, trainingState, sendTrainingInvite } from '@/lib/partnerTrainingFlow'
import { sendAgreement, countersign, sendExecutedEmail } from '@/lib/partnerAgreementFlow'
import { agreementMode } from '@/lib/partnerAgreement'
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
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const app = await load(id)
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (closeExpired(app)) await app.save()
  return NextResponse.json({ application: app.toObject(), training: trainingState(app), agreementMode: agreementMode(app.applicant.email) })
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
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const app = await load(id)
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  const by = auth.email || auth.name || 'admin'
  const note = String(body.note || '').trim().slice(0, 1000) || undefined
  const now = new Date()

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
      const r = await countersign(app, auth.name || MD_NAME, by, now)
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status || 409 })
      await app.save()
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
  return NextResponse.json({ application: app.toObject(), training: trainingState(app), agreementMode: agreementMode(app.applicant.email) })
}
