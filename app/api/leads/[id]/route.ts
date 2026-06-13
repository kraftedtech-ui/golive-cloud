import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Lead } from '@/models/Lead'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const body = await req.json()
    const lead = await Lead.findByIdAndUpdate(id, body, { new: true })
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ success: true, lead })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const lead = await Lead.findById(id)
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ success: true, lead })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
