import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { verify } from 'otplib'
import { requireSession } from '@/lib/apiAuth'

// POST /api/2fa/confirm — verify the first code to confirm setup and enable 2FA
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ success: false, error: 'Email and code are required' }, { status: 400 })
    }
    if (email.toLowerCase() !== auth.email?.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const user = await User.findOne({ email: email.toLowerCase(), active: true })
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ success: false, error: 'No pending 2FA setup found' }, { status: 404 })
    }

    const result = await verify({ token: code.trim(), secret: user.twoFactorSecret })
    if (!result.valid) {
      return NextResponse.json({ success: false, error: 'Incorrect code. Please try again.' }, { status: 401 })
    }

    user.twoFactorEnabled = true
    await user.save()

    return NextResponse.json({ success: true, message: '2FA enabled successfully' })
  } catch (err) {
    console.error('2FA confirm error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
