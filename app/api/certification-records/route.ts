import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { CertificationRecord } from '@/models/CertificationRecord'
import { requireSession } from '@/lib/apiAuth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const records = await CertificationRecord.find().sort({ createdAt: -1 })
    return NextResponse.json(records)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch certification records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const record = await CertificationRecord.create({
      ...body,
      status: 'requested',
      requestedAt: new Date(),
    })
    return NextResponse.json(record, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create certification record' }, { status: 500 })
  }
}
