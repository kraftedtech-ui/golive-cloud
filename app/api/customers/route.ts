import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Customer } from '@/models/Customer'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const filter: Record<string, string> = {}
    if (status) filter.status = status
    const customers = await Customer.find(filter).sort({ renewalDate: 1 }).limit(200)
    return NextResponse.json({ success: true, customers })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    // Auto-calculate ARR and renewal date
    const mrr = body.mrr || 0
    const startDate = new Date(body.startDate || Date.now())
    const billingCycle = body.billingCycle || 'monthly'

    const renewalDate = new Date(startDate)
    if (billingCycle === 'annual') {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1)
    } else {
      renewalDate.setMonth(renewalDate.getMonth() + 1)
    }

    const nextInvoiceDate = new Date(renewalDate)

    const customer = await Customer.create({
      ...body,
      mrr,
      arr: mrr * 12,
      startDate,
      renewalDate,
      nextInvoiceDate,
    })

    return NextResponse.json({ success: true, customer }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
