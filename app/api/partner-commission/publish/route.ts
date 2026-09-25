import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import { publishDraft } from '@/lib/commissionSchedule'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Admin: publish the draft as the next version, effective immediately, and notify partners. */
export async function POST() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  await connectDB()
  const r = await publishDraft(auth.email || auth.name || 'admin')
  if (!r.ok) return NextResponse.json({ error: r.error, problems: r.problems || [] }, { status: r.status || 400 })
  return NextResponse.json({
    ok: true,
    version: r.schedule?.version,
    notified: r.schedule?.notified,
    pendingAgreements: r.pendingAgreements,
  })
}
