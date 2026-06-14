import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function GET() {
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

    return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
