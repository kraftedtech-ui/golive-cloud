import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'
import { requireSession } from '@/lib/apiAuth'

// POST /api/2fa/reset — generate a NEW pending secret for an already-2FA-enabled user.
// IMPORTANT: This does NOT touch twoFactorEnabled or the active twoFactorSecret yet.
// The new secret is stored separately as "pendingSecret" until confirmed via /api/2fa/reset/confirm.
// This guarantees the account is never left without active 2FA, even mid-reset.
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }
    if (email.toLowerCase() !== auth.email?.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const user = await User.findOne({ email: email.toLowerCase(), active: true })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ success: false, error: '2FA is not yet set up for this account. Use the login flow to set it up first.' }, { status: 400 })
    }

    const newSecret = generateSecret()
    const issuer = 'GoLive Cloud Marketplace'
    const otpauthUrl = await generateURI({ secret: newSecret, issuer, label: user.email })
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

    // Store as pending — does NOT overwrite the active twoFactorSecret yet
    user.pendingTwoFactorSecret = newSecret
    await user.save()

    return NextResponse.json({ success: true, qrCode: qrCodeDataUrl, secret: newSecret })
  } catch (err) {
    console.error('2FA reset error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
