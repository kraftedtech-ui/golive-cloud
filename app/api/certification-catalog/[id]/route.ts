import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { CertificationCatalog } from '@/models/CertificationCatalog'
import { requireAdmin } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const body = await req.json()
    const item = await CertificationCatalog.findByIdAndUpdate(id, body, { new: true })
    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Failed to update catalog item' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    await CertificationCatalog.findByIdAndUpdate(id, { active: false })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to remove catalog item' }, { status: 500 })
  }
}
