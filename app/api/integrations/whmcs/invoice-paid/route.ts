import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyWhmcsSignature, processInvoicePaid, type WhmcsPayload } from '@/lib/whmcsIntegration'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Called by the WHMCS hook at app.golivenaija.com when an invoice is paid.
 * Rejects anything not signed with WHMCS_HOOK_SECRET within ten minutes.
 * Answers 200 for skipped and repeated invoices so WHMCS does not retry them.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!verifyWhmcsSignature(raw, req.headers.get('x-golive-timestamp'), req.headers.get('x-golive-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  let p: WhmcsPayload
  try { p = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }
  if (!Number.isInteger(p.invoiceId) || !Number.isInteger(p.clientId) || !Array.isArray(p.items)) {
    return NextResponse.json({ error: 'invoiceId, clientId and items are required' }, { status: 400 })
  }
  await connectDB()
  const r = await processInvoicePaid(p)
  return NextResponse.json({ ok: r.status !== 'error', ...r }, { status: r.status === 'error' ? 500 : 200 })
}
