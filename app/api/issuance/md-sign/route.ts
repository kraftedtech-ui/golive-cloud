import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import DocumentIssuance from '@/models/DocumentIssuance'
import { MD_NAME } from '@/lib/offerConfig'

export const dynamic = 'force-dynamic'

// Admin: the MD countersigns a signed issuance, completing execution.
// Mirrors the offer and onboarding flows: the employee signs first, the
// company executes second, and neither can be skipped.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: { ref?: string } = {}
  try { body = await req.json() } catch { /* fallthrough */ }
  const ref = String(body.ref || '')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  await connectDB()
  const iss = await DocumentIssuance.findOne({ ref })
  if (!iss) return NextResponse.json({ error: 'Issuance not found' }, { status: 404 })
  if (!iss.signedAt) {
    return NextResponse.json({ error: 'The employee has not signed these documents yet.' }, { status: 409 })
  }
  if (iss.mdSignedAt) {
    return NextResponse.json({ error: 'This issuance is already countersigned.' }, { status: 409 })
  }

  iss.mdSignedAt = new Date()
  iss.mdSignedName = (auth as { name?: string }).name || MD_NAME
  iss.status = 'executed'
  await iss.save()

  return NextResponse.json({ ok: true, mdSignedName: iss.mdSignedName, mdSignedAt: iss.mdSignedAt })
}
