import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { CertificationRecord } from '@/models/CertificationRecord'

const STATUS_DATE_FIELD: Record<string, string> = {
  approved_to_enroll: 'approvedAt',
  submitted: 'submittedAt',
  verified: 'verifiedAt',
  paid: 'paidAt',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await connectDB()
    const body = await req.json()
    const update: Record<string, unknown> = { ...body }
    if (body.status && STATUS_DATE_FIELD[body.status]) {
      update[STATUS_DATE_FIELD[body.status]] = new Date()
    }
    const record = await CertificationRecord.findByIdAndUpdate(id, update, { new: true })
    return NextResponse.json(record)
  } catch {
    return NextResponse.json({ error: 'Failed to update certification record' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await connectDB()
    await CertificationRecord.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete certification record' }, { status: 500 })
  }
}
