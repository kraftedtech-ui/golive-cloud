import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const email = req.nextUrl.searchParams.get('email')
    if (!email) return NextResponse.json({ success: false, error: 'email required' }, { status: 400 })
    const user = await User.findOne({ email: email.toLowerCase() }).select('-password')
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { email, phone, emailNotifications, profilePicture, currentPassword, newPassword } = body

    if (!email) return NextResponse.json({ success: false, error: 'email required' }, { status: 400 })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    // Handle password change separately with verification
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: 'Current password is required to set a new password' }, { status: 400 })
      }
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 })
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: 'New password must be at least 8 characters' }, { status: 400 })
      }
      user.password = newPassword // will be hashed by pre-save hook
    }

    if (phone !== undefined) user.phone = phone
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications
    if (profilePicture !== undefined) user.profilePicture = profilePicture

    await user.save()
    const { password: _, ...userWithoutPassword } = user.toObject()
    return NextResponse.json({ success: true, user: userWithoutPassword })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
