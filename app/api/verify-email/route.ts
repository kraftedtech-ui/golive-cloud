import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { EmailOTP } from '@/models/EmailOTP'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/verify-email — send a new OTP code
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit: max 5 OTP requests per email per hour
    const recentCount = await EmailOTP.countDocuments({
      email: normalizedEmail,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    })
    if (recentCount >= 5) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await EmailOTP.create({ email: normalizedEmail, code, expiresAt })

    await resend.emails.send({
      from: 'GoLive Cloud Marketplace <hello@golivecompany.com>',
      to: normalizedEmail,
      subject: `Your verification code: ${code}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e0f0f0">
          <div style="background:#0096c7;padding:20px 24px">
            <span style="color:#fff;font-size:18px;font-weight:700">GoLive Cloud Marketplace</span>
          </div>
          <div style="padding:28px 24px;text-align:center">
            <p style="font-size:14px;color:#444;margin:0 0 20px">Your verification code is:</p>
            <div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#0096c7;background:#f0f9ff;border-radius:8px;padding:16px;margin-bottom:20px">
              ${code}
            </div>
            <p style="font-size:12px;color:#888;margin:0">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
          </div>
          <div style="background:#f9f9f9;padding:12px 24px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
            The GoLive Digital Solutions Company Ltd · contact@golivecompany.com
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Verification code sent' })
  } catch (err) {
    console.error('Send OTP error:', err)
    return NextResponse.json({ success: false, error: 'Failed to send verification code' }, { status: 500 })
  }
}
