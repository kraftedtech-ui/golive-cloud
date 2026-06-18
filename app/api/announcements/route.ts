import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Announcement } from '@/models/Announcement'

export async function GET() {
  try {
    await connectDB()
    const announcements = await Announcement.find().sort({ pinned: -1, createdAt: -1 }).limit(50)
    return NextResponse.json(announcements)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { title, body: text, priority, createdBy, pinned } = body
    if (!title || !text || !createdBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const announcement = await Announcement.create({ title, body: text, priority: priority || 'normal', createdBy, pinned: pinned || false })
    return NextResponse.json(announcement, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
