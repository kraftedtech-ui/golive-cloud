import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { Resend } from 'resend'

const SECRET = process.env.ASSESSMENT_UPLOAD_SECRET || 'golive-assessment-2026'
const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

async function generateRef(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `GL-APP-${year}-`
  const last = await Application.findOne(
    { ref: { $regex: `^${prefix}` } },
    { ref: 1 },
    { sort: { ref: -1 } }
  ).lean() as { ref: string } | null
  let next = 1
  if (last) {
    const num = parseInt(last.ref.split('-').pop() || '0')
    next = num + 1
  }
  return `${prefix}${String(next).padStart(4, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-upload-token')
    if (token !== SECRET) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { name, email, role } = await req.json()
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email and role required' }, { status: 400 })
    }

    await connectDB()

    // Check for existing application with same email + role
    const existing = await Application.findOne({
      email: email.toLowerCase().trim(),
      role,
    }).lean() as { ref: string; status: string } | null

    if (existing) {
      return NextResponse.json({
        allowed: false,
        ref: existing.ref,
        message: `Our records show you have already applied for the ${role} role (Ref: ${existing.ref}). Only one application per role is permitted. Please contact talent.acquisition@golivecompany.com if you believe this is an error.`
      })
    }

    const ref = await generateRef()
    await Application.create({
      ref,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      status: 'applied',
    })

    // Email candidate their ref#
    resend.emails.send({
      from: 'GoLive Digital Solutions <talent.acquisition@golivecompany.com>',
      to: email.trim(),
      subject: `Your application reference — ${ref}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f4f7fb;padding:24px;border-radius:12px">
          <div style="background:#0d2233;border-radius:8px;padding:20px 24px;margin-bottom:20px;text-align:center">
            <h2 style="color:#9FE1CB;margin:0;font-size:16px;letter-spacing:0.05em">THE GOLIVE DIGITAL SOLUTIONS COMPANY LTD</h2>
            <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:11px">RC1644767</p>
          </div>
          <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3e9f0">
            <p style="font-size:14px;color:#1E293B;margin:0 0 16px">Dear ${name.trim()},</p>
            <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px">Thank you for applying for the <strong>${role}</strong> position at GoLive Digital Solutions. Your application has been received and assigned the following reference number:</p>
            <div style="background:#E1F5EE;border:1px solid #9FE1CB;border-radius:8px;padding:16px;text-align:center;margin:0 0 20px">
              <p style="font-size:11px;color:#0F6E56;font-weight:600;letter-spacing:0.1em;margin:0 0 4px">APPLICATION REFERENCE</p>
              <p style="font-size:28px;font-weight:700;color:#0D2233;margin:0;letter-spacing:0.05em">${ref}</p>
            </div>
            <p style="font-size:13px;color:#475569;line-height:1.6;margin:0 0 12px">Please <strong>save this reference number</strong> — you will need it for all future correspondence regarding your application.</p>
            <div style="background:#FFF8F6;border:1px solid #FAC8B8;border-left:4px solid #B85042;border-radius:8px;padding:14px;margin:0 0 14px">
              <p style="font-size:12px;font-weight:600;color:#B85042;margin:0 0 8px">⚠ Important — before you begin your assessment</p>
              <ul style="font-size:12px;color:#475569;line-height:1.9;margin:0;padding-left:16px">
                <li>Your <strong>camera will be active and recording</strong> for the full duration of the assessment</li>
                <li>Tab switching, window changes, and copy/paste attempts are detected and logged as violations</li>
                <li>External assistance including AI tools is strictly prohibited and will result in disqualification</li>
                <li>You are permitted <strong>one attempt only</strong> — a second attempt will be automatically blocked</li>
                <li>You must complete the assessment on a <strong>laptop or desktop</strong> with a working camera</li>
              </ul>
            </div>
            <p style="font-size:13px;color:#475569;line-height:1.6;margin:0 0 12px">You will be shown the full terms and conditions on screen before the assessment begins. You must accept them to proceed. If you are not ready to begin immediately, you can click <strong>Save for later</strong> on the terms page — your access code remains valid.</p>
            <p style="font-size:13px;color:#475569;line-height:1.6;margin:0">If you have any questions, contact us at <a href="mailto:talent.acquisition@golivecompany.com" style="color:#0F6E56">talent.acquisition@golivecompany.com</a>.</p>
          </div>
          <p style="color:#94A3B8;font-size:11px;text-align:center;margin-top:16px">GoLive Digital Solutions Company Ltd · RC1644767 · Lagos, Nigeria</p>
        </div>
      `
    }).catch((e: Error) => console.error('[register] email error:', e))

    return NextResponse.json({ allowed: true, ref })
  } catch (err) {
    console.error('[register] error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
