import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { MD_NAME } from '@/lib/offerConfig'

export const dynamic = 'force-dynamic'

// Admin: the MD countersigns the onboarding pack once the hire has signed.
// Mirrors the offer flow: the employee signs first, the company executes.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: { ref?: string } = {}
  try { body = await req.json() } catch { /* fallthrough */ }
  const ref = String(body.ref || '')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  await connectDB()
  const app = await Application.findOne({ ref })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!app.onboarding?.acknowledgedAt) {
    return NextResponse.json({ error: 'The hire has not signed the pack yet.' }, { status: 409 })
  }
  if (app.onboarding.mdAckAt) {
    return NextResponse.json({ error: 'The pack is already countersigned.' }, { status: 409 })
  }

  app.onboarding.mdAckAt = new Date()
  app.onboarding.mdAckName = MD_NAME
  app.markModified('onboarding')
  await app.save()

  return NextResponse.json({ ok: true, mdAckName: app.onboarding.mdAckName, mdAckAt: app.onboarding.mdAckAt })
}
