import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

// POST /api/auth/check-2fa — validates credentials first, reports whether 2FA setup or code entry is needed
// This runs BEFORE the actual NextAuth signIn, so the login page knows which step to show next.
//
// The env-based ADMIN_EMAIL/ADMIN_PASSWORD account is an intentional break-glass account with no
// database record. It is exempt from 2FA by design — it exists specifically for emergency access
// (e.g. database unreachable, all User records inaccessible). It should be used only in emergencies
// and its credentials should be treated with the same care as a root password.
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Check break-glass env admin account first — exempt from 2FA
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    if (adminEmail && normalizedEmail === adminEmail.toLowerCase() && password === adminPassword) {
      return NextResponse.json({ success: true, needsSetup: false, has2FA: false, breakGlass: true })
    }

    // Normal database-backed user
    const user = await User.findOne({ email: normalizedEmail, active: true })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }

    const validCreds = await bcrypt.compare(password, user.password)
    if (!validCreds) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }

    const needsSetup = !user.twoFactorEnabled
    return NextResponse.json({ success: true, needsSetup, has2FA: !needsSetup })
  } catch (err) {
    console.error('check-2fa error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
