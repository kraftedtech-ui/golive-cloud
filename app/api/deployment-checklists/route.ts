import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DeploymentChecklist } from '@/models/DeploymentChecklist'
import { requireSession } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')
    const customerId = searchParams.get('customerId')
    const filter: Record<string, string> = {}
    if (leadId) filter.leadId = leadId
    if (customerId) filter.customerId = customerId
    const items = await DeploymentChecklist.find(filter).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, items })
  } catch (err) {
    console.error('GET /api/deployment-checklists failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch checklists' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const item = await DeploymentChecklist.create({
      ...body,
      createdByName: auth.name || body.createdByName,
      createdByEmail: auth.email || body.createdByEmail,
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (err) {
    console.error('POST /api/deployment-checklists failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to create checklist' }, { status: 500 })
  }
}
