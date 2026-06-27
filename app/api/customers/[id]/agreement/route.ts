import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Customer } from '@/models/Customer'
import { requireSession } from '@/lib/apiAuth'

// Who can update agreement tracking: an admin, or the rep who actually
// closed this customer (they're the one chasing the signature day to day).
// This intentionally does NOT use requireAdmin like the general customer
// PATCH route does — it's scoped to only ever touch the `agreement` field.
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
      return NextResponse.json({ success: false, error: 'Only an admin or the rep who closed this customer can update this.' }, { status: 403 })
    }

    const body = await req.json()
    const allowed = ['status', 'method', 'signedByName', 'signedByEmail', 'signedDate', 'proofUrl', 'notes']
    const agreementUpdate: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) agreementUpdate[key] = body[key]
    }

    customer.agreement = { ...(customer.agreement || { status: 'pending' }), ...agreementUpdate }
    await customer.save()

    return NextResponse.json({ success: true, agreement: customer.agreement })
  } catch (err) {
    console.error('PATCH /api/customers/[id]/agreement failed:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
