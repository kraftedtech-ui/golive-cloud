import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { signOfferToken } from '@/lib/offerToken'
import { sendExecutedEmail } from '@/lib/offerEmail'
import { MD_NAME } from '@/lib/offerConfig'
import { nextEmployeeNumber, ensureEmployeeFromApplication } from '@/lib/employees'

export const dynamic = 'force-dynamic'

// Admin: MD countersigns a candidate-signed offer, fully executing it.
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
  if (!app || !app.offer || !app.offer.sentAt) {
    return NextResponse.json({ error: 'No offer on record for this application.' }, { status: 404 })
  }
  if (!app.offer.candidateSignedAt) {
    return NextResponse.json({ error: 'The candidate has not signed yet — countersign after their signature.' }, { status: 409 })
  }
  if (app.offer.mdSignedAt) {
    return NextResponse.json({ error: 'This offer is already fully executed.' }, { status: 409 })
  }

  // Mint the employee number at execution. Henry Arukwe = GL-EMP-001 by
  // convention (predates this system), so the counter starts new hires at 002.
  // nextEmployeeNumber scans BOTH Applications and Employees, so legacy hires
  // that exist only as employee records can never have their number re-issued.
  if (!app.employeeNumber) {
    app.employeeNumber = await nextEmployeeNumber()
  }

  app.offer.mdSignedAt = new Date()
  app.offer.mdSignedName = (session.user as { name?: string })?.name || MD_NAME
  app.markModified('offer')
  await app.save()

  // Countersignature is the pipeline's terminal step: create the employee
  // record now so the hire exists in the People (HR) layer from day zero.
  // Failure here is logged and never rolls back the executed signature.
  try {
    await ensureEmployeeFromApplication(app)
  } catch (e) {
    console.error('[employee] conversion at countersignature failed:', e)
  }

  // Fully-executed notice with a 30-day PDF link. Email failure is reported
  // but never rolls back the signature.
  const pdfToken = signOfferToken(app.ref, new Date(Date.now() + 30 * 864e5))
  const result = await sendExecutedEmail({
    name: app.name, email: app.email, role: app.role, ref: app.ref, pdfToken,
  })
  if (!result.ok) console.error('[offer] executed email failed:', result.error)

  return NextResponse.json({ ok: true, emailSent: result.ok, emailError: result.error })
}
