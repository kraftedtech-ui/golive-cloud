import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'

export const dynamic = 'force-dynamic'

// Admin: list all applications
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  await connectDB()
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const filter: Record<string, string> = {}
  if (role) filter.role = role
  if (status) filter.status = status
  const apps = await Application.find(filter).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ applications: apps })
}

// Admin: update application status or notes
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  await connectDB()
  const { ref, status, notes } = await req.json()
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
  const update: Record<string, string> = {}
  if (status) update.status = status
  if (notes !== undefined) update.notes = notes
  const app = await Application.findOneAndUpdate({ ref }, update, { new: true })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ application: app })
}
