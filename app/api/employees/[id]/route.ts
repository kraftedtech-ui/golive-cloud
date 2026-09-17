import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Employee from '@/models/Employee'
import Application from '@/models/Application'
import { User } from '@/models/User'

export const dynamic = 'force-dynamic'

// Admin: the full employee file — record, linked application (docs, screening,
// offer dates) and the linked portal account summary.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  await connectDB()
  const employee = await Employee.findById(id).lean() as Record<string, unknown> | null
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  let application: Record<string, unknown> | null = null
  if (employee.applicationRef) {
    application = await Application.findOne({ ref: employee.applicationRef })
      .select('ref role status offer.sentAt offer.candidateSignedAt offer.mdSignedAt onboarding.docs onboarding.acknowledgedAt onboarding.mdAckAt screening actualStartDate')
      .lean() as Record<string, unknown> | null
  }

  let portalUser: Record<string, unknown> | null = null
  const emails = [employee.workEmail, employee.email].filter(Boolean) as string[]
  if (employee.portalUserId) {
    portalUser = await User.findById(employee.portalUserId)
      .select('name email role active lastLogin startDate probationDays confirmedAt commissionEligible')
      .lean() as Record<string, unknown> | null
  }
  if (!portalUser && emails.length) {
    portalUser = await User.findOne({ email: { $in: emails } })
      .select('name email role active lastLogin startDate probationDays confirmedAt commissionEligible')
      .lean() as Record<string, unknown> | null
  }

  return NextResponse.json({ employee, application, portalUser })
}

const EDITABLE = new Set([
  'name', 'email', 'workEmail', 'role', 'jobCode', 'employmentType', 'status',
  'startDate', 'probationEndDate', 'confirmedAt', 'exitedAt', 'certification', 'notes',
])

// Admin: update lifecycle fields. Setting confirmedAt also syncs the linked
// portal User's confirmedAt — the commission engine derives probation vs
// confirmed rates from the User record, and written confirmation is the
// Addendum's condition for commissions becoming earned, so the two must agree.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* fallthrough */ }

  const update: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (!EDITABLE.has(k)) continue
    if (['startDate', 'probationEndDate', 'confirmedAt', 'exitedAt'].includes(k)) {
      update[k] = v ? new Date(String(v)) : null
    } else if (k === 'certification' && v && typeof v === 'object') {
      const c = v as Record<string, unknown>
      update.certification = {
        name: c.name || undefined,
        source: c.source || undefined,
        voucherIssuedAt: c.voucherIssuedAt ? new Date(String(c.voucherIssuedAt)) : undefined,
        deadline: c.deadline ? new Date(String(c.deadline)) : undefined,
        scheduledFor: c.scheduledFor ? new Date(String(c.scheduledFor)) : undefined,
        completedAt: c.completedAt ? new Date(String(c.completedAt)) : undefined,
      }
    } else {
      update[k] = v
    }
  }
  if (!Object.keys(update).length) {
    return NextResponse.json({ error: 'No editable fields in request' }, { status: 400 })
  }

  await connectDB()
  const employee = await Employee.findByIdAndUpdate(id, update, { new: true })
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  // Confirmation sync to the portal account (commission rates flip on this).
  let userSynced = false
  if ('confirmedAt' in update) {
    const emails = [employee.workEmail, employee.email].filter(Boolean)
    const user = employee.portalUserId
      ? await User.findById(employee.portalUserId)
      : await User.findOne({ email: { $in: emails } })
    if (user) {
      user.confirmedAt = (update.confirmedAt as Date | null) || undefined
      if (employee.startDate && !user.startDate) user.startDate = employee.startDate
      await user.save()
      if (!employee.portalUserId) {
        employee.portalUserId = String(user._id)
        await employee.save()
      }
      userSynced = true
    }
  }

  return NextResponse.json({ ok: true, employee, userSynced })
}
