import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ProductMapping } from '@/models/ProductMapping'
import { requireAdmin } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const body = await req.json()
    const item = await ProductMapping.findByIdAndUpdate(id, body, { new: true })
    return NextResponse.json(item)
  } catch (err) {
    console.error('PUT /api/product-mappings/[id] failed:', err)
    return NextResponse.json({ error: 'Failed to update product mapping' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    await ProductMapping.findByIdAndUpdate(id, { active: false })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/product-mappings/[id] failed:', err)
    return NextResponse.json({ error: 'Failed to remove product mapping' }, { status: 500 })
  }
}
