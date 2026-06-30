import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { SetupFeeCatalogItem } from '@/models/SetupFeeCatalog'
import { requireAdmin } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const body = await req.json()
    const item = await SetupFeeCatalogItem.findByIdAndUpdate(id, body, { new: true })
    return NextResponse.json(item)
  } catch (err) {
    console.error('PUT /api/setup-fee-catalog/[id] failed:', err)
    return NextResponse.json({ error: 'Failed to update fee item' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    await SetupFeeCatalogItem.findByIdAndUpdate(id, { active: false })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/setup-fee-catalog/[id] failed:', err)
    return NextResponse.json({ error: 'Failed to remove fee item' }, { status: 500 })
  }
}
