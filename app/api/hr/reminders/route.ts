import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Employee from '@/models/Employee'
import DocumentIssuance from '@/models/DocumentIssuance'
import { User } from '@/models/User'
import { Notification } from '@/models/Notification'
import { computeReminders, Reminder } from '@/lib/hrReminders'
import { sendReminderDigest } from '@/lib/hrReminderEmail'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function gather(): Promise<Reminder[]> {
  await connectDB()
  const [employees, issuances] = await Promise.all([
    Employee.find({ status: { $ne: 'exited' } })
      .select('employeeNumber name status employmentType startDate probationEndDate confirmedAt certification')
      .lean(),
    DocumentIssuance.find({ status: { $in: ['sent', 'signed'] } })
      .select('ref employeeId employeeName employeeNumber title sentAt signedAt mdSignedAt')
      .lean(),
  ])
  return computeReminders(employees as never[], issuances as never[], new Date())
}

// Admin: what needs attention right now. Read-only — computed on request,
// never stored, so it cannot go stale against the records it describes.
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const reminders = await gather()
  return NextResponse.json({ reminders, count: reminders.length })
}

/**
 * Scheduled sweep. Authenticated by CRON_SECRET rather than a session, since
 * cron has no user. Creates an in-portal notification per admin for anything
 * not already notified, and emails one digest.
 *
 * Idempotent by design: each reminder carries a stable key tied to the
 * threshold it crossed, so running the sweep repeatedly in a day does not
 * produce repeat notifications, and a missed day still fires once when it runs.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured on the server' }, { status: 503 })
  }
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (given !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reminders = await gather()
  if (!reminders.length) {
    return NextResponse.json({ ok: true, found: 0, notified: 0 })
  }

  // distinct() returns plain values, which avoids asserting a shape onto
  // Mongoose's inferred lean() type.
  const emails = ((await User.distinct('email', { role: 'admin', active: true })) as string[])
    .filter(Boolean)
  if (!emails.length) {
    return NextResponse.json({ ok: true, found: reminders.length, notified: 0, note: 'No active admin users to notify' })
  }

  let notified = 0
  const fresh: Reminder[] = []

  for (const r of reminders) {
    // The key encodes the threshold, so a given stage notifies once only.
    const existing = await Notification.findOne({ dedupeKey: r.key })
    if (existing) continue
    fresh.push(r)
    await Notification.insertMany(
      emails.map((email) => ({
        recipientEmail: email,
        type: 'hr_reminder',
        title: r.title,
        message: r.detail,
        link: '/portal/people',
        dedupeKey: r.key,
      }))
    )
    notified++
  }

  if (fresh.length) {
    await sendReminderDigest(fresh).catch((e) => console.error('[hr-reminders] digest failed:', e))
  }

  return NextResponse.json({ ok: true, found: reminders.length, notified, recipients: emails.length })
}
