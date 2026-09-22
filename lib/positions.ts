/**
 * positions.ts: shared logic for the Positions register.
 *
 * - ensureSeeded(): first run copies the roles from lib/careersConfig.ts into
 *   the database, so nothing is retyped. Hires already made are counted from
 *   existing (non-legacy) employee records.
 * - getPublicRoles(): what /careers renders. Falls back to the config file if
 *   the database is slow or down, so a public page never breaks on a Mongo
 *   outage.
 * - recordHireForApplication(): called at offer countersignature.
 */

import { connectDB } from '@/lib/mongodb'
import Position, { type IPosition } from '@/models/Position'
import Employee from '@/models/Employee'
import { CAREERS, type CareerRole } from '@/lib/careersConfig'

/** Positions that start with more than one opening. */
const SEED_OPENINGS: Record<string, number> = {
  'sales-support-associate': 2,
}

export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const remaining = (p: Pick<IPosition, 'openings' | 'hires'>) =>
  Math.max(0, (p.openings || 0) - (p.hires?.length || 0))

export async function ensureSeeded(): Promise<void> {
  await connectDB()
  if ((await Position.estimatedDocumentCount()) > 0) return

  const employees = await Employee.find({ legacyHire: { $ne: true } })
    .select('employeeNumber name role applicationRef startDate createdAt').lean() as unknown as {
      employeeNumber: string; name: string; role: string; applicationRef?: string | null
      startDate?: Date; createdAt?: Date
    }[]

  const docs = CAREERS.map((r, i) => {
    const hires = employees
      .filter((e) => e.role === r.title)
      .map((e) => ({
        employeeNumber: e.employeeNumber,
        applicationRef: e.applicationRef || undefined,
        name: e.name,
        hiredAt: e.createdAt || new Date(),
      }))
    const openings = SEED_OPENINGS[r.slug] ?? (r.open ? 1 : Math.max(1, hires.length))
    const full = hires.length >= openings
    return {
      slug: r.slug,
      title: r.title,
      department: r.department,
      type: r.type,
      location: r.location,
      salaryLower: r.salaryLower,
      salaryUpper: r.salaryUpper,
      commission: !!r.commission,
      summary: r.summary,
      responsibilities: r.responsibilities,
      requirements: r.requirements,
      status: 'open' as const,
      openings,
      hires,
      filledOn: full && hires.length ? hires[hires.length - 1].hiredAt : null,
      sortOrder: (i + 1) * 10,
    }
  })

  try {
    await Position.insertMany(docs, { ordered: false })
  } catch (e) {
    // A concurrent first request may have seeded already; duplicates are fine.
    if ((e as { code?: number })?.code !== 11000) throw e
  }
}

function toCareerRole(p: IPosition): CareerRole & { openingsLeft: number } {
  const left = remaining(p)
  return {
    slug: p.slug,
    title: p.title,
    department: p.department,
    type: p.type,
    location: p.location,
    salaryLower: p.salaryLower,
    salaryUpper: p.salaryUpper,
    commission: p.commission,
    open: left > 0,
    filledOn: p.filledOn
      ? new Date(p.filledOn).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      : undefined,
    summary: p.summary,
    responsibilities: p.responsibilities,
    requirements: p.requirements,
    openingsLeft: left,
  }
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

/**
 * Roles for the public page: open positions with openings left, then filled
 * ones. Draft and closed positions are never shown. On any database problem
 * the config file is used instead, so /careers always renders.
 */
export async function getPublicRoles(): Promise<{ roles: (CareerRole & { openingsLeft?: number })[]; source: 'db' | 'fallback' }> {
  try {
    const rows = await withTimeout((async () => {
      await ensureSeeded()
      return Position.find({ status: 'open' }).sort({ sortOrder: 1, createdAt: 1 }).lean()
    })(), 3000) as unknown as IPosition[]
    return { roles: rows.map(toCareerRole), source: 'db' }
  } catch (e) {
    console.error('[positions] falling back to careersConfig:', (e as Error)?.message)
    return { roles: CAREERS, source: 'fallback' }
  }
}

/**
 * Record a hire against the open position matching the application's role.
 * Idempotent: an application already recorded is not counted twice. Returns
 * a summary for the countersign message, or null when no position matches.
 */
export async function recordHireForApplication(app: {
  ref: string; name: string; role: string; employeeNumber?: string
}): Promise<{ title: string; left: number; filled: boolean; alreadyRecorded: boolean } | null> {
  await ensureSeeded()
  const pos = await Position.findOne({ title: app.role, status: 'open' })
  if (!pos) return null

  const already = pos.hires.some((h: { applicationRef?: string }) => h.applicationRef === app.ref)
  if (!already) {
    pos.hires.push({
      applicationRef: app.ref,
      employeeNumber: app.employeeNumber,
      name: app.name,
      hiredAt: new Date(),
    })
    if (pos.hires.length >= pos.openings && !pos.filledOn) pos.filledOn = new Date()
    pos.markModified('hires')
    await pos.save()
    if (app.employeeNumber) {
      await Employee.updateOne({ employeeNumber: app.employeeNumber }, { $set: { positionSlug: pos.slug } })
    }
  }
  const left = remaining(pos)
  return { title: pos.title, left, filled: left === 0, alreadyRecorded: already }
}
