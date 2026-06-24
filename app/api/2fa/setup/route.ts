import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'

// POST /api/2fa/setup — generate a new secret + QR code for a user to scan.
// NOTE: this runs as part of first-time login for brand-new accounts, BEFORE
// any session exists — it is intentionally gated by password verification
// below instead of a session check. Do not add requireSession() here.
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

    const secret = generateSecret()
    const issuer = 'GoLive Cloud Marketplace'
    const otpauthUrl = await generateURI({ secret, issuer, label: user.email })
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

    user.twoFactorSecret = secret
    user.twoFactorEnabled = false
    await user.save()

    return NextResponse.json({ success: true, qrCode: qrCodeDataUrl, secret })
  } catch (err) {
    console.error('2FA setup error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
