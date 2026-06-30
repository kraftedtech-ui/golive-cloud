import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DiscoveryAssessment } from '@/models/DiscoveryAssessment'
import { requireSession } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const leadId = new URL(req.url).searchParams.get('leadId')
    const filter = leadId ? { leadId } : {}
    const items = await DiscoveryAssessment.find(filter).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, items })
  } catch (err) {
    console.error('GET /api/discovery-assessments failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch assessments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const item = await DiscoveryAssessment.create({
      ...body,
      source: 'internal',
      completedByName: auth.name || body.completedByName,
      completedByEmail: auth.email || body.completedByEmail,
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (err) {
    console.error('POST /api/discovery-assessments failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to save assessment' }, { status: 500 })
  }
}
