import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const body = await req.json()

    // Don't allow password updates through this route — use a separate reset flow
    delete body.password

    const user = await User.findByIdAndUpdate(id, body, { new: true }).select('-password')
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    // Deactivate rather than delete — preserve audit trail
    const user = await User.findByIdAndUpdate(id, { active: false }, { new: true }).select('-password')
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
