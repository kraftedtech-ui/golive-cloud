import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { SCREENING_PROVIDER, type ScreeningStatus } from '@/lib/hireProvisioning'

export const dynamic = 'force-dynamic'

const VALID: ScreeningStatus[] = ['pending', 'in_progress', 'cleared', 'failed']

// Admin: record where the BCI background check stands for a hire.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: { ref?: string; status?: string; notes?: string } = {}
  try { body = await req.json() } catch { /* fallthrough */ }

  const ref = String(body.ref || '')
  const status = String(body.status || '') as ScreeningStatus
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
  if (!VALID.includes(status)) return NextResponse.json({ error: 'Invalid screening status' }, { status: 400 })

  await connectDB()
  const app = await Application.findOne({ ref })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!app.onboarding?.acknowledgedAt) {
    return NextResponse.json(
      { error: 'The hire has not completed the onboarding acknowledgement (which carries their screening consent) yet.' },
      { status: 409 }
    )
  }

  const prev = app.screening || {}
  app.screening = {
    ...prev,
    provider: SCREENING_PROVIDER,
    status,
    notes: typeof body.notes === 'string' ? body.notes : prev.notes,
    initiatedAt: prev.initiatedAt || (status !== 'pending' ? new Date() : undefined),
    clearedAt: status === 'cleared' ? new Date() : undefined,
  }
  app.markModified('screening')
  await app.save()

  return NextResponse.json({ ok: true, screening: app.screening })
}
