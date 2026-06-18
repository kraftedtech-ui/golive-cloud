import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Announcement } from '@/models/Announcement'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    await Announcement.findByIdAndDelete(params.id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const body = await req.json()
    const updated = await Announcement.findByIdAndUpdate(params.id, body, { new: true })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
