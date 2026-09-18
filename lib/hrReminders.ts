/**
 * hrReminders.ts — works out which HR lifecycle events are due attention.
 *
 * Pure computation over records that already exist, so the same function
 * serves the People panel banner and the scheduled sweep. Nothing here writes;
 * the caller decides whether to notify.
 *
 * The events chosen are the ones with an external or contractual consequence:
 * a probation window closing (commission rates and notice period turn on it),
 * a certification voucher expiring (the vendor enforces it, GoLive cannot
 * extend it), a quarter ending (targets are measured on it), and a document
 * sitting unsigned (nothing is executed until both signatures exist).
 */

export type ReminderSeverity = 'overdue' | 'urgent' | 'soon'

export interface Reminder {
  key: string                // stable per employee + event + threshold: used to avoid re-notifying
  severity: ReminderSeverity
  employeeId?: string
  employeeNumber?: string
  employeeName: string
  title: string
  detail: string
  dueAt?: Date
  days?: number              // negative when overdue
}

export interface ReminderEmployee {
  _id?: unknown
  employeeNumber?: string
  name?: string
  status?: string
  employmentType?: string
  startDate?: Date | string | null
  probationEndDate?: Date | string | null
  confirmedAt?: Date | string | null
  certification?: {
    name?: string
    deadline?: Date | string | null
    scheduledFor?: Date | string | null
    completedAt?: Date | string | null
  } | null
}

export interface ReminderIssuance {
  ref: string
  employeeName?: string
  employeeNumber?: string
  employeeId?: string
  title?: string
  sentAt?: Date | string | null
  signedAt?: Date | string | null
  mdSignedAt?: Date | string | null
}

const DAY = 864e5
const asDate = (v?: Date | string | null): Date | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return isNaN(d.getTime()) ? null : d
}
// Dates are stored as UTC midnight; compare in UTC so a reminder does not fire
// a day early or late for a viewer in another timezone.
const daysBetween = (from: Date, to: Date) =>
  Math.round((Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) -
              Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())) / DAY)

const fmt = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/**
 * The tightest stage the countdown has crossed, so one reminder fires per
 * stage rather than daily. Stages are scanned ascending: two days out must
 * match the 3-day stage, not the 14-day one it also satisfies.
 *
 * Once overdue, the stage becomes the week number, so an overdue item is
 * raised again each week instead of once and then never.
 */
function thresholdFor(days: number, stages: number[]): number | null {
  if (days < 0) return -1 - Math.floor(Math.abs(days) / 7)
  for (const s of [...stages].sort((a, b) => a - b)) if (days <= s) return s
  return null
}

function quarterEnd(now: Date): Date {
  const q = Math.floor(now.getUTCMonth() / 3)
  return new Date(Date.UTC(now.getUTCFullYear(), q * 3 + 3, 0))
}

export function computeReminders(
  employees: ReminderEmployee[],
  issuances: ReminderIssuance[] = [],
  now: Date = new Date()
): Reminder[] {
  const out: Reminder[] = []

  for (const e of employees) {
    if (e.status === 'exited') continue
    const name = e.name || 'Unknown'
    const id = e._id ? String(e._id) : undefined

    // ---- probation window closing ----
    const probEnd = asDate(e.probationEndDate)
    const confirmed = asDate(e.confirmedAt)
    if (probEnd && !confirmed) {
      const d = daysBetween(now, probEnd)
      const t = thresholdFor(d, [14, 7, 3, 1, 0])
      if (t !== null) {
        out.push({
          key: `${e.employeeNumber}:probation:${t}`,
          severity: d < 0 ? 'overdue' : d <= 3 ? 'urgent' : 'soon',
          employeeId: id, employeeNumber: e.employeeNumber, employeeName: name,
          title: d < 0 ? `Confirmation overdue for ${name}` : `Confirmation due for ${name}`,
          detail: d < 0
            ? `Probation ended ${fmt(probEnd)} (${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} ago) and no written confirmation is recorded. Commissions stay on probationary terms until it is.`
            : `Probation ends ${fmt(probEnd)}. Issue the written confirmation letter and record it on the employee file.`,
          dueAt: probEnd, days: d,
        })
      }
    }

    // ---- certification voucher expiring ----
    const cert = e.certification || {}
    const certDeadline = asDate(cert.deadline)
    if (certDeadline && !asDate(cert.completedAt)) {
      const d = daysBetween(now, certDeadline)
      const label = cert.name || 'Certification'
      const t = thresholdFor(d, [90, 60, 30, 14, 7, 1, 0])
      if (t !== null) {
        out.push({
          key: `${e.employeeNumber}:cert:${t}`,
          severity: d < 0 ? 'overdue' : d <= 30 ? 'urgent' : 'soon',
          employeeId: id, employeeNumber: e.employeeNumber, employeeName: name,
          title: d < 0 ? `${label} deadline passed for ${name}` : `${label} due for ${name}`,
          detail: d < 0
            ? `The voucher expired ${fmt(certDeadline)}. It cannot be extended by the Company.`
            : `${label} must be completed by ${fmt(certDeadline)} (${d} day${d === 1 ? '' : 's'}). This deadline is set by the voucher and cannot be extended.`,
          dueAt: certDeadline, days: d,
        })
      }
      // Booking not yet confirmed with the deadline in view.
      if (!asDate(cert.scheduledFor) && d >= 0 && d <= 90) {
        out.push({
          key: `${e.employeeNumber}:cert-booking:${thresholdFor(d, [90, 60, 30, 14]) ?? 0}`,
          severity: d <= 30 ? 'urgent' : 'soon',
          employeeId: id, employeeNumber: e.employeeNumber, employeeName: name,
          title: `${label} not yet booked — ${name}`,
          detail: `No exam date is recorded and the deadline is ${fmt(certDeadline)}. Booking early leaves room to reschedule once.`,
          dueAt: certDeadline, days: d,
        })
      }
    }

    // ---- quarter-end target review (confirmed staff only) ----
    if (confirmed) {
      const qEnd = quarterEnd(now)
      const d = daysBetween(now, qEnd)
      if (d >= 0 && d <= 7) {
        out.push({
          key: `${e.employeeNumber}:quarter:${qEnd.toISOString().slice(0, 10)}`,
          severity: 'soon',
          employeeId: id, employeeNumber: e.employeeNumber, employeeName: name,
          title: `Quarter-end review due for ${name}`,
          detail: `The quarter ends ${fmt(qEnd)}. Review attainment against target from CRM records; this feeds promotion eligibility.`,
          dueAt: qEnd, days: d,
        })
      }
    }
  }

  // ---- documents sitting unsigned ----
  for (const iss of issuances) {
    const sent = asDate(iss.sentAt)
    const signed = asDate(iss.signedAt)
    const counter = asDate(iss.mdSignedAt)
    const name = iss.employeeName || 'Unknown'

    if (sent && !signed) {
      const waiting = -daysBetween(now, sent)
      if (waiting >= 5) {
        out.push({
          key: `${iss.ref}:unsigned:${waiting >= 10 ? 10 : 5}`,
          severity: waiting >= 10 ? 'urgent' : 'soon',
          employeeId: iss.employeeId, employeeNumber: iss.employeeNumber, employeeName: name,
          title: `Unsigned after ${waiting} day${waiting === 1 ? '' : 's'} — ${name}`,
          detail: `"${iss.title || iss.ref}" was sent ${fmt(sent)} and has not been signed. The signing link expires 14 days after sending.`,
          dueAt: sent, days: -waiting,
        })
      }
    }
    if (signed && !counter) {
      const waiting = -daysBetween(now, signed)
      if (waiting >= 1) {
        out.push({
          key: `${iss.ref}:countersign:${waiting >= 3 ? 3 : 1}`,
          severity: waiting >= 3 ? 'urgent' : 'soon',
          employeeId: iss.employeeId, employeeNumber: iss.employeeNumber, employeeName: name,
          title: `Awaiting your countersignature — ${name}`,
          detail: `${name} signed "${iss.title || iss.ref}" on ${fmt(signed)}. Nothing is executed until you countersign.`,
          dueAt: signed, days: -waiting,
        })
      }
    }
  }

  const rank: Record<ReminderSeverity, number> = { overdue: 0, urgent: 1, soon: 2 }
  return out.sort((a, b) =>
    rank[a.severity] - rank[b.severity] || (a.days ?? 0) - (b.days ?? 0)
  )
}
