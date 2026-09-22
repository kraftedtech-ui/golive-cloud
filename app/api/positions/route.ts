import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Position from '@/models/Position'
import { ensureSeeded, slugify } from '@/lib/positions'

export const dynamic = 'force-dynamic'

// Admin: every position, including drafts and closed ones.
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  await ensureSeeded()
  const positions = await Position.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean()
  return NextResponse.json({ positions })
}

// Admin: create a position. It starts as a draft, so nothing goes public
// until it is deliberately opened.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let b: Record<string, unknown> = {}
  try { b = await req.json() } catch { /* fallthrough */ }

  const title = String(b.title || '').trim()
  const department = String(b.department || '').trim()
  const salaryLower = Number(b.salaryLower)
  const salaryUpper = Number(b.salaryUpper)
  if (!title || !department) {
    return NextResponse.json({ error: 'Title and team are required.' }, { status: 400 })
  }
  if (!(salaryLower > 0) || !(salaryUpper >= salaryLower)) {
    return NextResponse.json({ error: 'Enter a salary range where the upper figure is at least the lower.' }, { status: 400 })
  }

  await ensureSeeded()
  let slug = slugify(title) || 'position'
  if (await Position.exists({ slug })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const last = await Position.findOne({}).sort({ sortOrder: -1 }).select('sortOrder').lean() as { sortOrder?: number } | null
  const lines = (v: unknown) => (Array.isArray(v) ? v : String(v || '').split('\n'))
    .map((x) => String(x).trim()).filter(Boolean)

  await connectDB()
  const position = await Position.create({
    slug,
    title,
    department,
    type: String(b.type || 'Full-time'),
    location: String(b.location || 'Lagos, hybrid'),
    salaryLower,
    salaryUpper,
    commission: !!b.commission,
    summary: String(b.summary || ''),
    responsibilities: lines(b.responsibilities),
    requirements: lines(b.requirements),
    status: 'draft',
    openings: Math.max(1, parseInt(String(b.openings || '1'), 10) || 1),
    hires: [],
    sortOrder: (last?.sortOrder || 0) + 10,
  })
  return NextResponse.json({ ok: true, position })
}
