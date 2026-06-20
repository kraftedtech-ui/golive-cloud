import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/apiAuth'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    return NextResponse.json({ success: true, users })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const { name, email, password, role, invitedBy } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email and password are required' }, { status: 400 })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ success: false, error: 'A user with this email already exists' }, { status: 409 })
    }

    const user = await User.create({ name, email, password, role: role || 'sales', invitedBy })
    const { password: _, ...userWithoutPassword } = user.toObject()

    // Send welcome email with temporary credentials (after successful account creation)
    try {
      const roleLabel = (role || 'sales') === 'admin' ? 'Admin' : (role || 'sales') === 'viewer' ? 'Viewer' : 'Sales'
      await resend.emails.send({
        from: 'GoLive Portal <hello@golivecompany.com>',
        to: email,
        subject: 'Welcome to GoLive Cloud Marketplace — Your Account Details',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e0f0f0">
            <div style="background:#00B5AD;padding:20px 24px">
              <span style="color:#fff;font-size:20px;font-weight:700">golive</span>
              <span style="color:rgba(255,255,255,0.7);font-size:13px;margin-left:8px">Cloud Marketplace</span>
            </div>
            <div style="padding:28px 24px">
              <p style="font-size:15px;color:#1a1a1a;margin:0 0 6px">Hi ${name},</p>
              <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 20px">
                Welcome to The GoLive Digital Solutions Company Ltd! Your account on the GoLive Cloud Marketplace portal has been created${invitedBy ? ` by <strong>${invitedBy}</strong>` : ''}. Here are your login details:
              </p>
              <div style="background:#f5fffe;border:1px solid #c8f0ee;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333">
                  <tr><td style="padding:5px 0;color:#888;width:120px">Portal URL</td><td style="padding:5px 0;font-weight:600"><a href="https://cloud.golivecompany.com/portal/login" style="color:#00B5AD;text-decoration:none">cloud.golivecompany.com/portal</a></td></tr>
                  <tr><td style="padding:5px 0;color:#888">Email</td><td style="padding:5px 0;font-weight:600">${email}</td></tr>
                  <tr><td style="padding:5px 0;color:#888">Temporary Password</td><td style="padding:5px 0;font-weight:600;font-family:monospace;background:#fff3cd;padding:2px 8px;border-radius:4px">${password}</td></tr>
                  <tr><td style="padding:5px 0;color:#888">Role</td><td style="padding:5px 0">${roleLabel}</td></tr>
                </table>
              </div>
              <p style="font-size:12px;color:#b00;background:#fff5f5;border:1px solid #ffd6d6;border-radius:6px;padding:10px 14px;margin-bottom:20px">
                ⚠️ For security, please log in and change your password as soon as possible.
              </p>
              <a href="https://cloud.golivecompany.com/portal/login" style="display:inline-block;background:#00B5AD;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
                Log In to the Portal →
              </a>
            </div>
            <div style="background:#f9f9f9;padding:12px 24px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
              The GoLive Digital Solutions Company Ltd · contact@golivecompany.com · +234 808 358 7801
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr)
    }

    return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
