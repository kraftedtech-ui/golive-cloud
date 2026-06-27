import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Customer } from '@/models/Customer'
import { requireSession } from '@/lib/apiAuth'

// Same permission model as the agreement endpoint: an admin, or the rep who
// closed this customer — they're the one who'd actually know payment came in.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const customer = await Customer.findById(id)
    if (!customer) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const isOwner = customer.closedByEmail && customer.closedByEmail === auth.email
    if (auth.role !== 'admin' && !isOwner) {
      return NextResponse.json({ success: false, error: 'Only an admin or the rep who closed this customer can confirm payment.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    // Allow un-confirming too (date: null) in case it was marked by mistake.
    customer.lastPaymentConfirmedDate = body.date === null ? undefined : new Date(body.date || Date.now())
    await customer.save()

    return NextResponse.json({ success: true, lastPaymentConfirmedDate: customer.lastPaymentConfirmedDate })
  } catch (err) {
    console.error('PATCH /api/customers/[id]/payment-confirm failed:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
