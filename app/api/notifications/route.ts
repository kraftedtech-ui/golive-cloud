import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Notification } from '@/models/Notification'
import { requireSession } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const requestedEmail = req.nextUrl.searchParams.get('email')
    if (!requestedEmail) return NextResponse.json({ success: false, error: 'email required' }, { status: 400 })
    // Non-admins can only ever read their own notifications, regardless of what email is in the query string.
    const email = auth.role === 'admin' ? requestedEmail : auth.email
    if (!email) return NextResponse.json({ success: false, error: 'email required' }, { status: 400 })
    const notifications = await Notification.find({ recipientEmail: email }).sort({ createdAt: -1 }).limit(50)
    const unreadCount = await Notification.countDocuments({ recipientEmail: email, read: false })
    return NextResponse.json({ success: true, notifications, unreadCount })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const { recipientEmail, recipientEmails, type, title, message, link } = body

    // Support broadcasting to multiple recipients at once (e.g. announcements)
    const emails: string[] = recipientEmails || (recipientEmail ? [recipientEmail] : [])
    if (emails.length === 0 || !type || !title || !message) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const docs = emails.map(email => ({ recipientEmail: email, type, title, message, link }))
    const created = await Notification.insertMany(docs)
    return NextResponse.json({ success: true, notifications: created }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const { id, markAllReadForEmail, read } = body

    if (markAllReadForEmail) {
      // Non-admins can only mark their own notifications read, regardless of what's in the body.
      const email = auth.role === 'admin' ? markAllReadForEmail : auth.email
      await Notification.updateMany({ recipientEmail: email, read: false }, { read: true })
      return NextResponse.json({ success: true })
    }

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    const existing = await Notification.findById(id)
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (auth.role !== 'admin' && existing.recipientEmail !== auth.email) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    const notification = await Notification.findByIdAndUpdate(id, { read: read !== undefined ? read : true }, { new: true })
    return NextResponse.json({ success: true, notification })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
