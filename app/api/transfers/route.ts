import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose, { Schema } from 'mongoose'

const TransferSchema = new Schema({
  ref: { type: String, required: true, unique: true },
  transferType: { type: String, enum: ['csp', 'google', 'cpanel'], required: true },
  company: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  domain: { type: String, required: true },
  users: String,
  country: { type: String, default: 'Nigeria' },
  currentProvider: String,
  notes: String,
  status: { type: String, enum: ['new', 'contacted', 'in_progress', 'completed', 'lost'], default: 'new' },
  assignedTo: String,
  mrr: { type: Number, default: 0 },
}, { timestamps: true })

const Transfer = mongoose.models.Transfer || mongoose.model('Transfer', TransferSchema)

function generateRef(type: string) {
  const prefix = type === 'csp' ? 'CSP' : type === 'google' ? 'GWS' : 'CPL'
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(10000000 + Math.random() * 90000000)}`
}

export async function GET() {
  try {
    await connectDB()
    const transfers = await Transfer.find({}).sort({ createdAt: -1 }).limit(200)
    return NextResponse.json({ success: true, transfers })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const ref = generateRef(body.transferType || 'csp')
    const transfer = await Transfer.create({ ...body, ref })
    return NextResponse.json({ success: true, transfer, ref }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { id, ...update } = body
    const transfer = await Transfer.findByIdAndUpdate(id, update, { new: true })
    return NextResponse.json({ success: true, transfer })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
