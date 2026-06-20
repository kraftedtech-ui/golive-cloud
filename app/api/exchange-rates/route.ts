import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ExchangeRate } from '@/models/ExchangeRate'
import { getExchangeRates } from '@/lib/exchangeRates'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    const { rates, source, fetchedAt } = await getExchangeRates()
    return NextResponse.json({ success: true, rates, source, fetchedAt })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Failed to fetch exchange rates' }, { status: 500 })
  }
}

// Manual admin override — e.g. if the live FX API is down or a specific deal
// was actually settled at a different negotiated rate.
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const doc = await ExchangeRate.findOneAndUpdate(
      {},
      { rates: body.rates, source: 'manual', locked: body.locked ?? true, fetchedAt: new Date() },
      { upsert: true, new: true }
    )
    return NextResponse.json({ success: true, rates: doc.rates, source: doc.source, fetchedAt: doc.fetchedAt })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Failed to update exchange rates' }, { status: 500 })
  }
}
