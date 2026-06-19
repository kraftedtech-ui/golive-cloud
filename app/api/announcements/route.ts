import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Announcement } from '@/models/Announcement'
import { Notification } from '@/models/Notification'
import { User } from '@/models/User'

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

    // Broadcast in-app notification to all active team members
    try {
      const activeUsers = await User.find({ active: true }).select('email')
      const emails = activeUsers.map((u: any) => u.email)
      if (emails.length > 0) {
        const docs = emails.map((email: string) => ({
          recipientEmail: email,
          type: 'announcement',
          title: `New announcement: ${title}`,
          message: text.length > 120 ? text.slice(0, 120) + '...' : text,
          link: 'announcements',
        }))
        await Notification.insertMany(docs)
      }
    } catch (e) { console.error('Announcement broadcast notification failed:', e) }

    return NextResponse.json(announcement, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
