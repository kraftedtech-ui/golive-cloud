export type RiskLevel = 'paid' | 'upcoming' | 'billed' | 'notice1' | 'notice2' | 'overdue'

export interface SuspensionRiskInfo {
  level: RiskLevel
  label: string
  daysToNextCheckpoint: number | null
  nextCheckpointLabel: string | null
}

// 4Sight Dynamics Africa's actual monthly NCE cadence (per their onboarding
// email): billed on the 10th for the full calendar month, 1st suspension
// notice on the 16th, final notice on the 19th, suspension on the 20th if
// still unpaid.
const BILLING_DAY = 10
const NOTICE_1_DAY = 16
const NOTICE_2_DAY = 19
const SUSPENSION_DAY = 20

/**
 * Where a single monthly-billed customer currently sits in that cadence,
 * given today's date and the last time payment was confirmed for them.
 * Confirmation only counts if it happened in the current calendar month —
 * last month's "paid" doesn't cover this month's bill.
 */
export function computeSuspensionRisk(now: Date, lastPaymentConfirmedDate?: Date | string | null): SuspensionRiskInfo {
  const day = now.getDate()

  const confirmedThisCycle = (() => {
    if (!lastPaymentConfirmedDate) return false
    const d = new Date(lastPaymentConfirmedDate)
    if (isNaN(d.getTime())) return false
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })()

  if (confirmedThisCycle) {
    return { level: 'paid', label: 'Paid this cycle', daysToNextCheckpoint: null, nextCheckpointLabel: null }
  }
  if (day < BILLING_DAY) {
    const d = BILLING_DAY - day
    return { level: 'upcoming', label: `Bills on the 10th (in ${d}d)`, daysToNextCheckpoint: d, nextCheckpointLabel: 'Billing date' }
  }
  if (day < NOTICE_1_DAY) {
    const d = NOTICE_1_DAY - day
    return { level: 'billed', label: `Billed — 1st notice in ${d}d if unpaid`, daysToNextCheckpoint: d, nextCheckpointLabel: '1st suspension notice (16th)' }
  }
  if (day < NOTICE_2_DAY) {
    const d = NOTICE_2_DAY - day
    return { level: 'notice1', label: `1st notice window — final notice in ${d}d`, daysToNextCheckpoint: d, nextCheckpointLabel: 'Final notice (19th)' }
  }
  if (day < SUSPENSION_DAY) {
    const d = SUSPENSION_DAY - day
    return { level: 'notice2', label: `Final notice — suspension in ${d}d`, daysToNextCheckpoint: d, nextCheckpointLabel: 'Suspension (20th)' }
  }
  return { level: 'overdue', label: 'Past the suspension date — licenses may already be suspended', daysToNextCheckpoint: null, nextCheckpointLabel: null }
}

export const RISK_SEVERITY: Record<RiskLevel, number> = {
  overdue: 5, notice2: 4, notice1: 3, billed: 2, upcoming: 1, paid: 0,
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  paid: 'bg-green-50 text-green-700 ring-green-200',
  upcoming: 'bg-gray-50 text-gray-600 ring-gray-200',
  billed: 'bg-amber-50 text-amber-700 ring-amber-200',
  notice1: 'bg-orange-50 text-orange-700 ring-orange-200',
  notice2: 'bg-red-50 text-red-700 ring-red-200',
  overdue: 'bg-red-100 text-red-800 ring-red-300',
}
