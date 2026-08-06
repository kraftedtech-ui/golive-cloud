import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { requireSession } from '@/lib/apiAuth'
import { deriveCommissionPeriod, type CommissionPeriodSource } from '@/lib/commissionPeriod'

/**
 * GET /api/commission-period
 *
 * Returns the signed-in user's derived probation/confirmed status, so the
 * Commission Dashboard and the Proposal Generator both show the correct rate
 * without anyone toggling a switch.
 *
 * Admins additionally get every rep's status, which is what makes this
 * manageable once there is more than one person selling.
 */
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDB()

    const me = await User.findOne({ email: auth.email })
      .select('name email role startDate probationDays confirmedAt')
      .lean()

    const mine = deriveCommissionPeriod((me || {}) as CommissionPeriodSource)

    const isAdmin = (me as { role?: string } | null)?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ success: true, mine })
    }

    const reps = await User.find({ active: true, role: { $in: ['admin', 'sales'] } })
      .select('name email role startDate probationDays confirmedAt')
      .sort({ name: 1 })
      .lean()

    const team = reps.map((u: Record<string, unknown>) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      ...deriveCommissionPeriod(u as CommissionPeriodSource),
    }))

    return NextResponse.json({ success: true, mine, team })
  } catch (err) {
    console.error('GET /api/commission-period failed:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to derive commission period' },
      { status: 500 }
    )
  }
}
