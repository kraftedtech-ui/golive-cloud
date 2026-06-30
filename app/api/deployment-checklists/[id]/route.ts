import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DeploymentChecklist } from '@/models/DeploymentChecklist'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const item = await DeploymentChecklist.findById(id)
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('GET /api/deployment-checklists/[id] failed:', err)
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
    const item = await DeploymentChecklist.findByIdAndUpdate(id, body, { new: true })
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('PUT /api/deployment-checklists/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to update checklist' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const deleted = await DeploymentChecklist.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/deployment-checklists/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
