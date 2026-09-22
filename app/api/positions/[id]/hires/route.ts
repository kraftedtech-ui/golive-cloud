import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Position from '@/models/Position'
import Employee from '@/models/Employee'

export const dynamic = 'force-dynamic'

// Admin: record a hire against this position by employee number. Used for
// hires the countersign step did not match automatically (for example a role
// title that differs from the position title).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  let b: { employeeNumber?: string } = {}
  try { b = await req.json() } catch { /* fallthrough */ }
  const num = String(b.employeeNumber || '').trim().toUpperCase()
  if (!num) return NextResponse.json({ error: 'Enter an employee number, e.g. GL-EMP-003.' }, { status: 400 })

  await connectDB()
  const pos = await Position.findById(id)
  if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 })
  const emp = await Employee.findOne({ employeeNumber: num })
  if (!emp) return NextResponse.json({ error: `No employee record for ${num}.` }, { status: 404 })
  if (pos.hires.some((h: { employeeNumber?: string }) => h.employeeNumber === num)) {
    return NextResponse.json({ error: `${emp.name} is already recorded against this position.` }, { status: 409 })
  }

  pos.hires.push({
    employeeNumber: num,
    applicationRef: emp.applicationRef || undefined,
    name: emp.name,
    hiredAt: new Date(),
  })
  if (pos.hires.length >= pos.openings && !pos.filledOn) pos.filledOn = new Date()
  pos.markModified('hires')
  await pos.save()
  await Employee.updateOne({ _id: emp._id }, { $set: { positionSlug: pos.slug } })
  return NextResponse.json({ ok: true, position: pos })
}

// Admin: undo a recorded hire (?employeeNumber= or ?applicationRef=). The
// position reopens if that leaves an opening unfilled.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const url = new URL(req.url)
  const num = url.searchParams.get('employeeNumber')
  const ref = url.searchParams.get('applicationRef')
  if (!num && !ref) return NextResponse.json({ error: 'employeeNumber or applicationRef required' }, { status: 400 })

  await connectDB()
  const pos = await Position.findById(id)
  if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 })

  const before = pos.hires.length
  const removed = pos.hires.filter((h: { employeeNumber?: string; applicationRef?: string }) =>
    (num && h.employeeNumber === num) || (ref && h.applicationRef === ref))
  pos.hires = pos.hires.filter((h: { employeeNumber?: string; applicationRef?: string }) =>
    !((num && h.employeeNumber === num) || (ref && h.applicationRef === ref)))
  if (pos.hires.length === before) {
    return NextResponse.json({ error: 'That hire is not recorded against this position.' }, { status: 404 })
  }
  if (pos.hires.length < pos.openings) pos.filledOn = null
  pos.markModified('hires')
  await pos.save()

  for (const h of removed) {
    if (h.employeeNumber) {
      await Employee.updateOne({ employeeNumber: h.employeeNumber, positionSlug: pos.slug }, { $unset: { positionSlug: 1 } })
    }
  }
  return NextResponse.json({ ok: true, position: pos })
}
