import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DiscoveryAssessment } from '@/models/DiscoveryAssessment'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const item = await DiscoveryAssessment.findById(id)
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('GET /api/discovery-assessments/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const body = await req.json()
    const item = await DiscoveryAssessment.findByIdAndUpdate(id, body, { new: true })
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('PUT /api/discovery-assessments/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to update assessment' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const deleted = await DiscoveryAssessment.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/discovery-assessments/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
