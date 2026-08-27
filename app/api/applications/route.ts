import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { sendShortlistEmail } from '@/lib/shortlistEmail'

export const dynamic = 'force-dynamic'

// Admin: list all applications
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  await connectDB()
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const filter: Record<string, string> = {}
  if (role) filter.role = role
  if (status) filter.status = status
  const apps = await Application.find(filter).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ applications: apps })
}

// Admin: update application status or notes.
//
// Automation: moving a candidate to "shortlisted" sends the interview
// invitation (salary band + booking link per lib/shortlistConfig) exactly
// once — guarded by shortlistEmailSentAt. Passing resendInvite: true forces
// a deliberate re-send for a candidate already shortlisted. Email failure
// never rolls back the status change; the result is returned so the panel
// can surface it.
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  await connectDB()
  const { ref, status, notes, resendInvite } = await req.json()
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
  const update: Record<string, string> = {}
  if (status) update.status = status
  if (notes !== undefined) update.notes = notes
  const app = await Application.findOneAndUpdate({ ref }, update, { new: true })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let emailSent: boolean | undefined
  let emailError: string | undefined
  const shouldSend =
    (status === 'shortlisted' && !app.shortlistEmailSentAt) ||
    (resendInvite === true && app.status === 'shortlisted')

  if (shouldSend) {
    const result = await sendShortlistEmail({
      name: app.name,
      email: app.email,
      role: app.role,
      ref: app.ref,
    })
    emailSent = result.ok
    emailError = result.error
    if (result.ok) {
      app.shortlistEmailSentAt = new Date()
      await app.save()
    } else {
      console.error(`[shortlist] invitation to ${app.ref} failed:`, result.error)
    }
  }

  return NextResponse.json({ application: app, emailSent, emailError })
}
