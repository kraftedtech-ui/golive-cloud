import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import DealRegistration, { MILESTONE_KINDS, type MilestoneKind } from '@/models/DealRegistration'
import { computeValidity, dealConflict, refreshLapse, notifyDecision, notifyMilestone, MILESTONE_LABEL } from '@/lib/dealRegistration'
import { currentSchedule } from '@/lib/commissionSchedule'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Admin actions on a registration, each recorded on its timeline:
 *   approve { force? }        start validity, lock the schedule version
 *   refuse { note }
 *   milestone { kind, at, note? }   GoLive-confirmed only; extends to 60 days after it
 *   extend { until, note }    a later hard limit agreed in writing
 *   won { note? } / lost { note? } / release { note }
 *   linkWhmcs { clientId, line? }   GoLive Naija billing client; clientId null removes the link
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  await connectDB()
  const d = await DealRegistration.findById(id)
  if (!d) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const by = auth.email || auth.name || 'admin'
  const note = String(body.note || '').trim().slice(0, 1000) || undefined
  const now = new Date()
  refreshLapse(d, now)

  switch (body.action) {
    case 'approve': {
      if (d.status !== 'pending') return NextResponse.json({ error: 'Only a registration awaiting approval can be approved.' }, { status: 409 })
      const fresh = await dealConflict(d.organisation, d.partnerNumber, id)
      d.conflict = fresh
      if (fresh?.kind === 'partner') { await d.save(); return NextResponse.json({ error: `Already registered to ${fresh.owner}. The first valid registration takes precedence.` }, { status: 409 }) }
      if (fresh && body.force !== true) {
        await d.save()
        return NextResponse.json({ error: `${d.organisation} matches ${fresh.kind === 'customer' ? 'an existing customer' : `a pipeline lead${fresh.owner ? ` held by ${fresh.owner}` : ''}`} (${fresh.match}).`, needsConfirm: true }, { status: 409 })
      }
      const cur = await currentSchedule()
      const v = computeValidity(now, [])
      d.status = 'active'; d.approvedAt = now; d.approvedBy = by; d.decisionNote = note
      d.scheduleVersion = cur?.version; d.validUntil = v.validUntil; d.hardLimit = v.hardLimit
      d.timeline.push({ at: now, by, action: `Approved${fresh ? ` (override: matched ${fresh.match})` : ''}. Schedule version ${cur?.version ?? 'none'} locked`, note })
      await d.save(); notifyDecision(d)
      break
    }
    case 'refuse': {
      if (d.status !== 'pending') return NextResponse.json({ error: 'Only a registration awaiting approval can be refused.' }, { status: 409 })
      if (!note) return NextResponse.json({ error: 'Give a reason; the partner sees it.' }, { status: 400 })
      d.status = 'refused'; d.decisionNote = note
      d.timeline.push({ at: now, by, action: 'Refused', note })
      await d.save(); notifyDecision(d)
      break
    }
    case 'milestone': {
      if (d.status !== 'active') return NextResponse.json({ error: d.status === 'lapsed' ? 'This registration has lapsed. Extend it in writing first if you agree to revive it.' : 'Milestones can only be recorded on a live registration.' }, { status: 409 })
      const kind = String(body.kind || '') as MilestoneKind
      if (!MILESTONE_KINDS.includes(kind)) return NextResponse.json({ error: 'Unknown milestone.' }, { status: 400 })
      // Compare calendar days in Lagos time. The date box sends a bare date,
      // which would otherwise read as midnight UTC and fall before a same-day
      // approval. The stored time is clamped between approval and now.
      const lagosDay = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
      const raw = String(body.at || '')
      const picked = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : lagosDay(now)
      const approved = new Date(d.approvedAt!)
      if (picked < lagosDay(approved) || picked > lagosDay(now)) return NextResponse.json({ error: `The milestone date must be between ${lagosDay(approved)} (approval) and ${lagosDay(now)} (today, Lagos time).` }, { status: 400 })
      let at = new Date(`${picked}T12:00:00+01:00`)
      if (at < approved) at = approved
      if (at > now) at = now
      d.milestones.push({ kind, at, by, note, recordedAt: now })
      const before = d.validUntil
      const v = computeValidity(new Date(d.approvedAt!), d.milestones, d.hardLimit)
      d.validUntil = v.validUntil
      d.timeline.push({ at: now, by, action: `Milestone: ${MILESTONE_LABEL[kind]} (${at.toISOString().slice(0, 10)})`, note: `Valid until ${v.validUntil.toISOString().slice(0, 10)}${before && v.validUntil.getTime() === new Date(before).getTime() ? ' (unchanged: at the 180-day limit or already later)' : ''}` })
      d.markModified('milestones')
      await d.save()
      if (!before || v.validUntil.getTime() !== new Date(before).getTime()) notifyMilestone(d, kind)
      break
    }
    case 'extend': {
      if (!['active', 'lapsed'].includes(d.status)) return NextResponse.json({ error: 'Only a live or lapsed registration can be extended.' }, { status: 409 })
      if (!note) return NextResponse.json({ error: 'An extension must be agreed in writing: record the reason.' }, { status: 400 })
      const until = new Date(String(body.until || ''))
      if (isNaN(until.getTime()) || until <= now) return NextResponse.json({ error: 'Choose a date in the future.' }, { status: 400 })
      d.hardLimit = until; d.validUntil = until
      if (d.status === 'lapsed') d.status = 'active'
      d.timeline.push({ at: now, by, action: `Extended in writing to ${until.toISOString().slice(0, 10)}`, note })
      await d.save(); notifyMilestone(d, 'written_confirmation')
      break
    }
    case 'won':
    case 'lost': {
      if (!['active', 'lapsed'].includes(d.status)) return NextResponse.json({ error: 'Only a live or lapsed registration can be closed.' }, { status: 409 })
      const valid = d.status === 'active'
      d.status = body.action; d.closedAt = now
      d.validAtClose = body.action === 'won' ? valid : undefined
      d.timeline.push({ at: now, by, action: body.action === 'won' ? `Won${valid ? '' : ' after the registration lapsed: no first-year commission (clause 5.5)'}` : 'Lost', note })
      await d.save()
      break
    }
    case 'linkWhmcs': {
      const cid = Number(body.clientId)
      if (body.clientId === null || body.clientId === '' ) {
        d.whmcsClientId = undefined; d.whmcsLine = undefined; d.whmcsLinkedAt = undefined; d.whmcsLinkedBy = undefined
        d.timeline.push({ at: now, by, action: 'GoLive Naija billing link removed' })
        await d.save(); break
      }
      if (!Number.isInteger(cid) || cid <= 0) return NextResponse.json({ error: 'Enter the WHMCS client ID (the number in the client profile address, userid=...).' }, { status: 400 })
      const taken = await DealRegistration.findOne({ whmcsClientId: cid, _id: { $ne: d._id } }).select('ref partnerName')
      if (taken) return NextResponse.json({ error: `WHMCS client ${cid} is already linked to ${taken.ref} (${taken.partnerName}).` }, { status: 409 })
      d.whmcsClientId = cid
      d.whmcsLine = String(body.line || '').trim() || undefined
      d.whmcsLinkedAt = now; d.whmcsLinkedBy = by
      d.timeline.push({ at: now, by, action: `Linked to GoLive Naija billing client ${cid}${d.whmcsLine ? ` (${d.whmcsLine})` : ''}`, note: 'Paid invoices for this client now record commission automatically' })
      await d.save()
      break
    }
    case 'release': {
      if (!['pending', 'active', 'lapsed'].includes(d.status)) return NextResponse.json({ error: 'Nothing to release.' }, { status: 409 })
      if (!note) return NextResponse.json({ error: 'Give a reason.' }, { status: 400 })
      d.status = 'released'
      d.timeline.push({ at: now, by, action: 'Released', note })
      await d.save()
      break
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
  return NextResponse.json({ deal: d.toObject() })
}
