import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { EmailOTP } from '@/models/EmailOTP'
import crypto from 'crypto'

// In-memory-safe token: HMAC of email, signed with server secret, with expiry baked in.
// This avoids needing a separate "verified session" collection — the token itself proves verification.
function signVerificationToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
  const expiresAt = Date.now() + 30 * 60 * 1000 // valid for 30 minutes after verification
  const payload = `${email.toLowerCase()}:${expiresAt}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${signature}`).toString('base64')
}

export function verifyToken(token: string, email: string): boolean {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const [tokenEmail, expiresAtStr, signature] = decoded.split(':')
    const expiresAt = parseInt(expiresAtStr, 10)

    if (tokenEmail !== email.toLowerCase()) return false
    if (Date.now() > expiresAt) return false

    const expectedPayload = `${tokenEmail}:${expiresAtStr}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(expectedPayload).digest('hex')
    return signature === expectedSignature
  } catch {
    return false
  }
}

// POST /api/verify-email/check — verify the OTP code
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ success: false, error: 'Email and code are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const otpRecord = await EmailOTP.findOne({ email: normalizedEmail, verified: false }).sort({ createdAt: -1 })

    if (!otpRecord) {
      return NextResponse.json({ success: false, error: 'No pending verification found. Please request a new code.' }, { status: 404 })
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Code expired. Please request a new one.' }, { status: 410 })
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ success: false, error: 'Too many incorrect attempts. Please request a new code.' }, { status: 429 })
    }

    if (otpRecord.code !== code.trim()) {
      otpRecord.attempts += 1
      await otpRecord.save()
      return NextResponse.json({ success: false, error: 'Incorrect code. Please try again.' }, { status: 401 })
    }

    otpRecord.verified = true
    await otpRecord.save()

    const verificationToken = signVerificationToken(normalizedEmail)

    return NextResponse.json({ success: true, verificationToken })
  } catch (err) {
    console.error('Verify OTP error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
