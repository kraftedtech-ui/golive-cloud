import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { verify } from 'otplib'
import { requireSession } from '@/lib/apiAuth'

// POST /api/2fa/reset/confirm — verify a code against the PENDING secret.
// Only on success do we promote pendingTwoFactorSecret -> twoFactorSecret.
// At every point before this succeeds, the OLD secret remains the active one,
// so the account is never without working 2FA.
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
    if (!user || !user.pendingTwoFactorSecret) {
      return NextResponse.json({ success: false, error: 'No pending 2FA reset found. Please start the reset again.' }, { status: 404 })
    }

    const result = await verify({ token: code.trim(), secret: user.pendingTwoFactorSecret })
    if (!result.valid) {
      return NextResponse.json({ success: false, error: 'Incorrect code. Please try again.' }, { status: 401 })
    }

    user.twoFactorSecret = user.pendingTwoFactorSecret
    user.pendingTwoFactorSecret = undefined
    user.twoFactorEnabled = true
    await user.save()

    return NextResponse.json({ success: true, message: '2FA reset successfully' })
  } catch (err) {
    console.error('2FA reset confirm error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
