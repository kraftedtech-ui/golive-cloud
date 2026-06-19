import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'

// POST /api/2fa/setup — generate a new secret + QR code for a user to scan
// Requires email + password to confirm identity before issuing a new secret
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase(), active: true })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const secret = authenticator.generateSecret()
    const issuer = 'GoLive Cloud Marketplace'
    const otpauthUrl = authenticator.keyuri(user.email, issuer, secret)
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

    // Store secret temporarily (not yet enabled) — only confirmed after user verifies a code
    user.twoFactorSecret = secret
    user.twoFactorEnabled = false
    await user.save()

    return NextResponse.json({ success: true, qrCode: qrCodeDataUrl, secret })
  } catch (err) {
    console.error('2FA setup error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
