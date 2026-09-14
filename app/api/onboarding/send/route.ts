import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { signOnboardingToken } from '@/lib/onboardingToken'
import { sendOnboardingPackEmail } from '@/lib/onboardingEmail'

export const dynamic = 'force-dynamic'

// Admin: email the onboarding pack link to a fully-executed hire.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: { ref?: string } = {}
  try { body = await req.json() } catch { /* fallthrough */ }
  const ref = String(body.ref || '')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  await connectDB()
  const app = await Application.findOne({ ref })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!app.offer?.mdSignedAt) return NextResponse.json({ error: 'The offer is not fully executed yet' }, { status: 409 })
  const docs = app.onboarding?.docs || []
  if (!docs.length) return NextResponse.json({ error: 'Upload at least one document before sending the pack' }, { status: 409 })

  const deadline = new Date(Date.now() + 14 * 864e5)
  const token = signOnboardingToken(app.ref, deadline)
  const result = await sendOnboardingPackEmail({
    name: app.name, email: app.email, role: app.role, ref: app.ref,
    employeeNumber: app.employeeNumber,
    docLabels: docs.map((d: { label?: string; filename?: string }) => d.label || d.filename || 'Document'),
    deadline, token,
  })
  if (!result.ok) return NextResponse.json({ error: result.error || 'Email failed' }, { status: 502 })

  if (!app.onboarding) app.onboarding = { docs: [] } as never
  app.onboarding!.sentAt = new Date()
  app.markModified('onboarding')
  await app.save()
  return NextResponse.json({ ok: true })
}
