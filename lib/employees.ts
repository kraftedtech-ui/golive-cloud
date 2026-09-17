/**
 * employees.ts — shared helpers for the post-hire (Employee) layer.
 *
 * nextEmployeeNumber() scans BOTH collections. Applications hold the numbers
 * minted at countersignature; Employees additionally hold legacy hires that
 * never had an application (GL-EMP-001). Scanning only one collection could
 * re-issue a number that already exists in the other.
 *
 * ensureEmployeeFromApplication() is the pipeline's terminal step: called at
 * MD countersignature (and by the backfill script for hires countersigned
 * before this layer existed). Idempotent — safe to call repeatedly.
 */

import Application from '@/models/Application'
import Employee, { IEmployee } from '@/models/Employee'
import { OFFER_CONFIG } from '@/lib/offerConfig'

const numOf = (v: unknown) =>
  parseInt(String(v || '').replace(/\D/g, ''), 10) || 0

export async function nextEmployeeNumber(): Promise<string> {
  const [fromApps, fromEmployees] = await Promise.all([
    Application.distinct('employeeNumber'),
    Employee.distinct('employeeNumber'),
  ])
  // Floor of 1: Henry Arukwe is GL-EMP-001 by convention even when neither
  // collection carries him yet, so system-minted numbers start at 002.
  const max = [...fromApps, ...fromEmployees].reduce(
    (mx: number, v: unknown) => Math.max(mx, numOf(v)),
    1
  )
  return 'GL-EMP-' + String(max + 1).padStart(3, '0')
}

interface AppLike {
  ref: string
  name: string
  email: string
  role: string
  employeeNumber?: string
  provisionedUserId?: string
  actualStartDate?: string
  offer?: { jobCode?: string; startDate?: string }
}

/**
 * Create (or return) the Employee record for a countersigned application.
 * Never throws on duplicates — a concurrent or repeated call returns the
 * existing record. Callers should treat failure as non-fatal: an employee
 * record must never roll back a signature.
 */
export async function ensureEmployeeFromApplication(app: AppLike): Promise<IEmployee | null> {
  if (!app?.ref || !app.employeeNumber) return null

  const existing = await Employee.findOne({
    $or: [{ applicationRef: app.ref }, { employeeNumber: app.employeeNumber }],
  })
  if (existing) return existing

  const startStr = app.actualStartDate || app.offer?.startDate || ''
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(startStr) ? new Date(startStr) : undefined
  const probationEndDate = startDate
    ? new Date(startDate.getTime() + 90 * 864e5)
    : undefined

  try {
    return await Employee.create({
      employeeNumber: app.employeeNumber,
      name: app.name,
      email: app.email,
      role: app.role,
      jobCode: app.offer?.jobCode || OFFER_CONFIG[app.role]?.jobCode,
      employmentType: 'full-time',
      status: 'probation',
      legacyHire: false,
      applicationRef: app.ref,
      portalUserId: app.provisionedUserId || undefined,
      startDate,
      probationEndDate,
      docs: [],
    })
  } catch (e: unknown) {
    // Duplicate key from a concurrent call — fetch and return the winner.
    if ((e as { code?: number })?.code === 11000) {
      return Employee.findOne({ employeeNumber: app.employeeNumber })
    }
    throw e
  }
}
