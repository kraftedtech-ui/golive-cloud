import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Customer } from '@/models/Customer'
import { Lead } from '@/models/Lead'
import { requireSession } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
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
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()

    // Idempotency: a lead can only be converted once. Check both the explicit
    // leadId flag and (as a belt-and-braces check for older data) an existing
    // customer already created from the same leadRef.
    if (body.leadId) {
      const existingLead = await Lead.findById(body.leadId)
      if (existingLead?.convertedToCustomer) {
        return NextResponse.json(
          { success: false, error: 'This lead has already been converted to a customer.' },
          { status: 409 }
        )
      }
    }
    if (body.leadRef) {
      const existingCustomer = await Customer.findOne({ leadRef: body.leadRef })
      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'A customer already exists for this lead.', customer: existingCustomer },
          { status: 409 }
        )
      }
    }

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

    const { leadId, ...customerBody } = body

    const customer = await Customer.create({
      ...customerBody,
      mrr,
      arr: mrr * 12,
      startDate,
      renewalDate,
      nextInvoiceDate,
    })

    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, { convertedToCustomer: true, customerId: customer._id })
    }

    return NextResponse.json({ success: true, customer }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
