import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin, requireRole, forbiddenAction } from '@/lib/apiAuth'
import DealRegistration from '@/models/DealRegistration'
import { refreshLapse } from '@/lib/dealRegistration'

export const dynamic = 'force-dynamic'

/** Admin: every partner deal registration, newest first. Lapses are applied on read. */
export async function GET() {
  const auth = await requireRole(['admin', 'operations'])
  if (auth instanceof NextResponse) return auth
  await connectDB()
  const deals = await DealRegistration.find({}).sort({ submittedAt: -1 })
  for (const d of deals) if (refreshLapse(d)) await d.save()
  return NextResponse.json({ deals: deals.map((d) => d.toObject()) })
}
