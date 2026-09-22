import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Position from '@/models/Position'

export const dynamic = 'force-dynamic'

const TEXT = ['title', 'department', 'type', 'location', 'summary'] as const
const lines = (v: unknown) => (Array.isArray(v) ? v : String(v || '').split('\n'))
  .map((x) => String(x).trim()).filter(Boolean)

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await connectDB()
  const position = await Position.findById(id).lean()
  if (!position) return NextResponse.json({ error: 'Position not found' }, { status: 404 })
  return NextResponse.json({ position })
}

// Admin: edit any field. Changing the headcount re-evaluates whether the
// position is filled, so lowering openings to the number already hired
// fills it, and raising it reopens it.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  let b: Record<string, unknown> = {}
  try { b = await req.json() } catch { /* fallthrough */ }

  await connectDB()
  const pos = await Position.findById(id)
  if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 })

  for (const k of TEXT) if (typeof b[k] === 'string') (pos as unknown as Record<string, unknown>)[k] = (b[k] as string).trim()
  if ('salaryLower' in b) pos.salaryLower = Number(b.salaryLower)
  if ('salaryUpper' in b) pos.salaryUpper = Number(b.salaryUpper)
  if (!(pos.salaryLower > 0) || !(pos.salaryUpper >= pos.salaryLower)) {
    return NextResponse.json({ error: 'Enter a salary range where the upper figure is at least the lower.' }, { status: 400 })
  }
  if ('commission' in b) pos.commission = !!b.commission
  if ('responsibilities' in b) pos.responsibilities = lines(b.responsibilities)
  if ('requirements' in b) pos.requirements = lines(b.requirements)
  if ('status' in b && ['draft', 'open', 'closed'].includes(String(b.status))) {
    pos.status = String(b.status) as 'draft' | 'open' | 'closed'
  }
  if ('openings' in b) {
    const n = parseInt(String(b.openings), 10)
    if (!(n >= 1)) return NextResponse.json({ error: 'Openings must be at least 1.' }, { status: 400 })
    pos.openings = n
  }
  if (!pos.title || !pos.department) {
    return NextResponse.json({ error: 'Title and team are required.' }, { status: 400 })
  }

  const full = pos.hires.length >= pos.openings
  if (full && !pos.filledOn) pos.filledOn = new Date()
  if (!full) pos.filledOn = null

  await pos.save()
  return NextResponse.json({ ok: true, position: pos })
}

// Admin: delete only a position nobody has been hired into. Anything with
// hires is part of an employee's history, so close it instead.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await connectDB()
  const pos = await Position.findById(id)
  if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 })
  if (pos.hires.length > 0) {
    return NextResponse.json(
      { error: 'This position has hires recorded against it. Close it instead of deleting it.' },
      { status: 409 }
    )
  }
  await pos.deleteOne()
  return NextResponse.json({ ok: true })
}
