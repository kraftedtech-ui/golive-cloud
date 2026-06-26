import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { PricingCatalog } from '@/models/PricingCatalog'
import { requireAdmin } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const body = await req.json()
    if (body.retailUSD != null || body.resellerUSD != null) {
      const existing = await PricingCatalog.findById(id)
      if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      const retailUSD = body.retailUSD != null ? Number(body.retailUSD) : existing.retailUSD
      const resellerUSD = body.resellerUSD != null ? Number(body.resellerUSD) : existing.resellerUSD
      body.marginUSD = retailUSD - resellerUSD
      body.marginPercent = retailUSD > 0 ? body.marginUSD / retailUSD : 0
    }
    const item = await PricingCatalog.findByIdAndUpdate(id, body, { new: true })
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('PUT /api/pricing-catalog/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to update catalog item' }, { status: 500 })
  }
}

// Soft-delete only. Catalog entries from past pricelists stay queryable for
// historical proposals/commissions even after a newer import supersedes them.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    await PricingCatalog.findByIdAndUpdate(id, { active: false })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/pricing-catalog/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to remove catalog item' }, { status: 500 })
  }
}
