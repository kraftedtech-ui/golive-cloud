/**
 * recruitmentSweep.ts: the automated steps in recruitment, run nightly by
 * the same job as the HR reminders (POST /api/hr/reminders).
 *
 *  1. Reminder: applicants who have not started a week after their code was
 *     sent get one reminder, once.
 *  2. Lapsed: applicants whose window has closed without a submission are
 *     marked lapsed, quietly. They were told the closing date twice.
 *  3. Decline: candidates below the pass mark are declined automatically
 *     once the hold has passed, and told courteously. The hold exists so
 *     the email never arrives within minutes of submission, and so there is
 *     time to intervene from the portal (moving the candidate to any other
 *     status cancels the decline).
 *
 * Every step is idempotent: each record carries the timestamp of what has
 * been sent, so a re-run never sends anything twice.
 */

import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import {
  sendAssessmentReminder, sendNotProgressed, REMINDER_AFTER_DAYS,
} from '@/lib/recruitment'

export interface SweepResult {
  reminders: number
  lapsed: number
  declined: number
  errors: string[]
}

export async function runRecruitmentSweep(now: Date = new Date()): Promise<SweepResult> {
  await connectDB()
  const out: SweepResult = { reminders: 0, lapsed: 0, declined: 0, errors: [] }

  // 1. Reminders
  const remindBefore = new Date(now.getTime() - REMINDER_AFTER_DAYS * 864e5)
  const toRemind = await Application.find({
    status: 'applied',
    accessCode: { $exists: true },
    codeSentAt: { $lte: remindBefore },
    codeExpiresAt: { $gt: now },
    reminderSentAt: { $exists: false },
    paper: { $exists: false },
  }).select('ref name email role accessCode codeExpiresAt')
  for (const a of toRemind) {
    const r = await sendAssessmentReminder({
      name: a.name, email: a.email, role: a.role, ref: a.ref, code: a.accessCode!, expiresAt: a.codeExpiresAt!,
    })
    if (r.ok) {
      a.reminderSentAt = now
      await a.save()
      out.reminders++
    } else {
      out.errors.push(`reminder ${a.ref}: ${r.error}`)
    }
  }

  // 2. Lapsed windows
  const lapsed = await Application.updateMany(
    {
      status: 'applied',
      accessCode: { $exists: true },
      codeExpiresAt: { $lte: now },
      assessmentDate: { $exists: false },
    },
    { $set: { status: 'lapsed' } }
  )
  out.lapsed = lapsed.modifiedCount

  // 3. Automatic declines, only while the candidate is still simply "assessed".
  //    Any other status means someone has acted, and the decline is dropped.
  const toDecline = await Application.find({
    status: 'assessed',
    eligible: false,
    declineDueAt: { $lte: now },
    declinedAt: { $exists: false },
  }).select('ref name email role')
  for (const a of toDecline) {
    const r = await sendNotProgressed({ name: a.name, email: a.email, role: a.role, ref: a.ref })
    if (r.ok) {
      a.status = 'not_progressed'
      a.declinedAt = now
      a.rejectionEmailSentAt = now
      await a.save()
      out.declined++
    } else {
      out.errors.push(`decline ${a.ref}: ${r.error}`)
    }
  }

  return out
}
