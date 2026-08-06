/**
 * Derives whether a rep is on probation or confirmed.
 *
 * Confirmation is a DECISION, not a date. A rep stays on the probation rate
 * until an admin actively confirms them — passing day 90 makes them *eligible*
 * for confirmation, nothing more. Auto-confirming on a calendar would mean a
 * pay rise happening because nobody was looking, and would remove the prompt
 * for the review conversation that should accompany it.
 *
 * The rate that applies to a deal is fixed at the closing event, not at
 * payment. SalesDocument snapshots `commissionRate` when a version is
 * accepted, so a deal closed on probation keeps the probation rate even if it
 * is paid months later. Nothing here recalculates history.
 */

export type CommissionPeriod = 'probation' | 'confirmed'

export const DEFAULT_PROBATION_DAYS = 90

export interface CommissionPeriodSource {
  startDate?: Date | string | null
  probationDays?: number | null
  /** Set by an admin. This — and only this — moves a rep to the higher rate. */
  confirmedAt?: Date | string | null
}

export interface CommissionPeriodInfo {
  period: CommissionPeriod
  /** False when there is no start date on record — the result is a fallback. */
  derived: boolean
  startDate?: string
  probationDays: number
  /** The day probation completes and the rep becomes eligible for review. */
  probationEndsOn?: string
  confirmedAt?: string
  /** Negative once probation has passed without a confirmation. */
  daysRemaining?: number
  /** Probation served but nobody has confirmed — a review is outstanding. */
  awaitingConfirmation: boolean
  /** Short human-readable status for admin lists. */
  label: string
}

function toDate(v?: Date | string | null): Date | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function deriveCommissionPeriod(
  user: CommissionPeriodSource,
  now: Date = new Date()
): CommissionPeriodInfo {
  const probationDays =
    typeof user.probationDays === 'number' && user.probationDays > 0
      ? user.probationDays
      : DEFAULT_PROBATION_DAYS

  const startDate = toDate(user.startDate)
  const endsOn = startDate ? addDays(startDate, probationDays) : null

  // An explicit confirmation by an admin is the only route to the higher rate.
  const confirmedAt = toDate(user.confirmedAt)
  if (confirmedAt && confirmedAt <= now) {
    return {
      period: 'confirmed',
      derived: true,
      probationDays,
      confirmedAt: fmt(confirmedAt),
      startDate: startDate ? fmt(startDate) : undefined,
      probationEndsOn: endsOn ? fmt(endsOn) : undefined,
      awaitingConfirmation: false,
      label: `Confirmed since ${fmt(confirmedAt)}`,
    }
  }

  if (!startDate || !endsOn) {
    // No start date on record. Probation is the safe default: under-paying is
    // correctable, over-paying against a rate not yet earned is not a
    // conversation anyone wants.
    return {
      period: 'probation',
      derived: false,
      probationDays,
      awaitingConfirmation: false,
      label: 'Probation (no start date on record)',
    }
  }

  const daysRemaining = Math.ceil((endsOn.getTime() - now.getTime()) / 86400000)
  const awaitingConfirmation = now > endsOn

  return {
    period: 'probation', // stays here until an admin confirms
    derived: true,
    startDate: fmt(startDate),
    probationDays,
    probationEndsOn: fmt(endsOn),
    daysRemaining,
    awaitingConfirmation,
    label: awaitingConfirmation
      ? `Probation served ${fmt(endsOn)} — awaiting confirmation`
      : daysRemaining <= 14
        ? `Probation — eligible ${fmt(endsOn)} (${daysRemaining} day${daysRemaining === 1 ? '' : 's'})`
        : `Probation — eligible ${fmt(endsOn)}`,
  }
}

/** Reps approaching the end of probation, so a review can be scheduled. */
export function isConfirmingSoon(info: CommissionPeriodInfo, withinDays = 30): boolean {
  return (
    info.period === 'probation' &&
    !info.awaitingConfirmation &&
    typeof info.daysRemaining === 'number' &&
    info.daysRemaining > 0 &&
    info.daysRemaining <= withinDays
  )
}

/** Probation served but no confirmation recorded — needs an admin decision. */
export function isReviewOverdue(info: CommissionPeriodInfo): boolean {
  return info.awaitingConfirmation
}
