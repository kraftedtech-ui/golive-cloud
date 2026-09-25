import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import CommissionSchedule from '@/models/CommissionSchedule'
import { cleanRows, currentSchedule, diffRows, publishProblems } from '@/lib/commissionSchedule'
import { buildRows, computeMargins, getSettings, guardrails, AUTO_KEYS, ODOO_MARGINS } from '@/lib/commissionRules'
import { rowKey } from '@/lib/commissionSchedule'

export const dynamic = 'force-dynamic'

async function state() {
  const [current, draft, history, settings, margins] = await Promise.all([
    currentSchedule(),
    CommissionSchedule.findOne({ status: 'draft' }),
    CommissionSchedule.find({ status: 'published' }).sort({ version: -1 }).lean(),
    getSettings(),
    computeMargins(),
  ])
  const built = buildRows(settings, margins, (draft?.rows || current?.rows || []).map((r) => ({ line: r.line, basis: r.basis, referral: r.referral, sales: r.sales })))
  return {
    settings: { salesShare: settings.salesShare, referralShare: settings.referralShare, renewalFactor: settings.renewalFactor, odooLevel: settings.odooLevel, updatedAt: settings.updatedAt, updatedBy: settings.updatedBy },
    margins,
    odooMargins: ODOO_MARGINS[settings.odooLevel],
    explain: built.explain,
    autoKeys: [...AUTO_KEYS],
    guardrails: current ? guardrails(current.rows, built.rows) : [],
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
    const [settings, margins] = await Promise.all([getSettings(), computeMargins()])
    const base = (current?.rows || []).map((r) => ({ line: r.line, basis: r.basis, referral: r.referral, sales: r.sales }))
    draft = new CommissionSchedule({ status: 'draft', rows: buildRows(settings, margins, base).rows, summary: '' })
  }
  if (!body.start) {
    // Automatic lines cannot be edited by hand: they come from the rules, so a
    // hand edit would be silently overwritten by the next recalculation.
    const auto = new Set(AUTO_KEYS)
    const kept = new Map(draft.rows.filter((r) => auto.has(rowKey(r))).map((r) => [rowKey(r), r]))
    const incoming = cleanRows(body.rows).map((r) => kept.get(rowKey(r)) ? { line: r.line, basis: r.basis, referral: kept.get(rowKey(r))!.referral, sales: kept.get(rowKey(r))!.sales } : r)
    const missingAuto = [...kept.values()].filter((r) => !incoming.some((x) => rowKey(x) === rowKey(r)))
    draft.rows = [...incoming, ...missingAuto]
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
