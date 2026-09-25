import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import { regenerate } from '@/lib/commissionRules'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Admin: recalculate the automatic lines now, from the current price list and settings. */
export async function POST() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  await connectDB()
  const r = await regenerate('Manual recalculation', auth.email || auth.name || 'admin')
  return NextResponse.json({ ok: true, ...r })
}
