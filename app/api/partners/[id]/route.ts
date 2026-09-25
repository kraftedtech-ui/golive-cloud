import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import PartnerApplication, { PARTNER_STAGES, type PartnerStage } from '@/models/PartnerApplication'
import { findConflicts } from '@/lib/partners'
import { STAGE_LABELS } from '@/lib/partnerConfig'

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
  return NextResponse.json({ application: app.toObject() })
}

/**
 * Admin actions, each recorded on the timeline with who did it:
 *   { action: 'stage', status, note }          move through accreditation
 *   { action: 'account', accountId, decision, note, force? }  register or refuse a named account;
 *        force: true overrides a customer or pipeline match (never another partner's registration)
 *   { action: 'notes', notes }                 private MD notes
 *   { action: 'recheck' }                      re-run the conflict check on every account
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
  return NextResponse.json({ application: app.toObject() })
}
