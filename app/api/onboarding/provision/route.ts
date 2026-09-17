import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { User } from '@/models/User'
import Employee from '@/models/Employee'
import { accessForRole } from '@/lib/hireProvisioning'
import { Resend } from 'resend'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

// Admin: create the hire's portal account.
//
// Gated on BOTH conditions, deliberately: the onboarding pack must be
// acknowledged (that is where the hire consents to screening) AND the BCI
// check must be cleared. No account can exist before either — employment is
// conditional on screening, so portal access is too.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: { ref?: string; workEmail?: string; startDate?: string } = {}
  try { body = await req.json() } catch { /* fallthrough */ }

  const ref = String(body.ref || '')
  const workEmail = String(body.workEmail || '').trim().toLowerCase()
  const startDate = String(body.startDate || '').trim()
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(workEmail)) {
    return NextResponse.json({ error: 'A valid work email is required' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json({ error: 'Start date must be YYYY-MM-DD' }, { status: 400 })
  }

  await connectDB()
  const app = await Application.findOne({ ref })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!app.onboarding?.acknowledgedAt) {
    return NextResponse.json({ error: 'Onboarding acknowledgement is not complete.' }, { status: 409 })
  }
  if (app.screening?.status !== 'cleared') {
    return NextResponse.json(
      { error: 'The BCI background check is not cleared. Set screening to Cleared before provisioning access.' },
      { status: 409 }
    )
  }
  if (app.provisionedUserId) {
    return NextResponse.json({ error: 'A portal account has already been created for this hire.' }, { status: 409 })
  }

  const existing = await User.findOne({ email: workEmail })
  if (existing) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })

  const access = accessForRole(app.role)
  const tempPassword =
    crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '') + 'A1!'

  // User.create runs the model's pre-save hook, so the password is hashed.
  const user = await User.create({
    name: app.name,
    email: workEmail,
    password: tempPassword,
    role: access.portalRole,
    startDate: new Date(startDate),
    probationDays: 90,
    commissionEligible: access.commissionEligible,
    invitedBy: 'Onboarding',
  })

  app.provisionedUserId = String(user._id)
  app.actualStartDate = startDate
  app.status = 'onboarded'
  await app.save()

  // Keep the People (HR) layer in step: link the portal account and set the
  // real start date + 90-day probation window on the employee record.
  try {
    const start = new Date(startDate)
    await Employee.updateOne(
      { applicationRef: ref },
      {
        $set: {
          portalUserId: String(user._id),
          workEmail,
          startDate: start,
          probationEndDate: new Date(start.getTime() + 90 * 864e5),
        },
      }
    )
  } catch (e) {
    console.error('[employee] provisioning link failed:', e)
  }

  let emailSent = true
  let emailError: string | undefined
  try {
    const { error } = await resend.emails.send({
      from: 'GoLive Portal <hello@golivecompany.com>',
      to: workEmail,
      subject: 'Your GoLive portal account — sign-in details',
      html: `
  <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.65;max-width:600px;margin:0 auto">
    <p>Dear ${app.name.split(' ')[0]},</p>
    <p>Your background verification is complete and your GoLive portal account is ready. Welcome to the team${app.employeeNumber ? ` — your employee number is <strong>${app.employeeNumber}</strong>` : ''}.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;background:#f0f7f8;border:1px solid #cfe3e5;border-radius:8px">
      <tr><td style="padding:8px 12px;color:#6b7280">Portal</td><td style="padding:8px 12px;font-weight:600"><a href="https://cloud.golivecompany.com/portal/login" style="color:#0e7c86">cloud.golivecompany.com/portal</a></td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Email</td><td style="padding:8px 12px;font-weight:600">${workEmail}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Temporary password</td><td style="padding:8px 12px;font-family:monospace;font-weight:600">${tempPassword}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Access level</td><td style="padding:8px 12px">${access.portalRole === 'viewer' ? 'Viewer (read-only)' : access.portalRole}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Start date</td><td style="padding:8px 12px;font-weight:600">${startDate}</td></tr>
    </table>
    <p style="margin-top:16px;padding:12px 16px;background:#fff8ec;border:1px solid #f0d9a8;border-radius:8px">
      <strong>On first sign-in:</strong> change this temporary password immediately, then enable two-factor authentication in Account Settings. Both are required before you handle company or client information.
    </p>
    <p>Your access level reflects your Role Charter. If your duties require something the portal does not currently let you do, raise it with the Managing Director rather than working around it.</p>
    <p style="margin-bottom:2px">Best regards,</p>
    <p style="margin-top:0"><strong style="color:#0e7c86">The GoLive Digital Solutions Company Ltd</strong><br>
    <span style="font-size:12px;color:#777">RC1644767</span></p>
  </div>`,
    })
    if (error) { emailSent = false; emailError = String(error.message || error) }
  } catch (e) {
    emailSent = false
    emailError = (e as Error)?.message || 'send failed'
  }

  return NextResponse.json({
    ok: true,
    emailSent,
    emailError,
    user: { id: String(user._id), email: workEmail, role: access.portalRole, commissionEligible: access.commissionEligible },
    tempPassword: emailSent ? undefined : tempPassword,
  })
}
