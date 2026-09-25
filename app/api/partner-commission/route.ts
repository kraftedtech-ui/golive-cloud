import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import CommissionSchedule from '@/models/CommissionSchedule'
import { cleanRows, currentSchedule, diffRows, publishProblems } from '@/lib/commissionSchedule'
import { STARTER_SCHEDULE } from '@/lib/partnerAgreement'

export const dynamic = 'force-dynamic'

async function state() {
  const [current, draft, history] = await Promise.all([
    currentSchedule(),
    CommissionSchedule.findOne({ status: 'draft' }),
    CommissionSchedule.find({ status: 'published' }).sort({ version: -1 }).lean(),
  ])
  return {
    current: current ? current.toObject() : null,
    draft: draft ? draft.toObject() : null,
    draftChanges: draft ? diffRows(current?.rows || [], draft.rows) : [],
    draftProblems: draft ? publishProblems(draft.rows) : [],
    history,
  }
}

/** Admin: current version, the draft (if any) with its changes and problems, and every published version. */
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  await connectDB()
  return NextResponse.json(await state())
}

/**
 * Admin: save the draft. Body { rows, summary }. With { start: true } and no
 * draft, a draft is started from the current version (or the starter lines).
 */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  let body: { rows?: unknown; summary?: string; start?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  await connectDB()
  let draft = await CommissionSchedule.findOne({ status: 'draft' })
  if (!draft) {
    const current = await currentSchedule()
    const seed = current ? current.rows.map((r) => ({ line: r.line, basis: r.basis, referral: r.referral, sales: r.sales })) : STARTER_SCHEDULE.map((r) => ({ ...r }))
    draft = new CommissionSchedule({ status: 'draft', rows: seed, summary: '' })
  }
  if (!body.start) {
    draft.rows = cleanRows(body.rows)
    draft.summary = String(body.summary || '').trim().slice(0, 1000)
  }
  await draft.save()
  return NextResponse.json(await state())
}

/** Admin: discard the draft. Published versions can never be deleted. */
export async function DELETE() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  await connectDB()
  await CommissionSchedule.deleteOne({ status: 'draft' })
  return NextResponse.json(await state())
}
