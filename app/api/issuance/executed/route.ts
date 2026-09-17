import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import DocumentIssuance from '@/models/DocumentIssuance'
import { buildExecutedPack } from '@/lib/executedPack'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Admin: download the executed issuance as one merged PDF — certificate of
// acknowledgement, then each PDF document with its own execution page.
// Reuses the onboarding-pack builder, so the paper artefact is identical in
// form to the one produced at hire.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const ref = new URL(req.url).searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  await connectDB()
  const iss = await DocumentIssuance.findOne({ ref }).lean() as {
    ref: string; employeeName: string; employeeNumber: string
    role?: string; jobCode?: string
    docs?: { filename: string; label?: string; acknowledgedAt?: Date }[]
    signatureName?: string; signedAt?: Date; ip?: string
    mdSignedName?: string; mdSignedAt?: Date
  } | null
  if (!iss) return NextResponse.json({ error: 'Issuance not found' }, { status: 404 })
  if (!iss.signedAt) {
    return NextResponse.json({ error: 'The employee has not signed yet.' }, { status: 409 })
  }
  if (!iss.mdSignedAt) {
    return NextResponse.json({ error: 'Countersign before downloading the executed copy.' }, { status: 409 })
  }

  try {
    const pdf = await buildExecutedPack({
      ref: iss.ref,
      name: iss.employeeName,
      role: iss.role || '',
      employeeNumber: iss.employeeNumber,
      jobCode: iss.jobCode,
      docs: (iss.docs || []).map((d) => ({
        filename: d.filename,
        label: d.label || d.filename,
        acknowledgedAt: d.acknowledgedAt || iss.signedAt,
      })),
      signatureName: iss.signatureName || iss.employeeName,
      signedAt: iss.signedAt,
      ip: iss.ip,
      mdAckName: iss.mdSignedName || 'Adeniyi Olayemi',
      mdAckAt: iss.mdSignedAt,
      docsDir: path.join(process.cwd(), 'employee-docs', String(iss.employeeNumber).replace(/[^a-zA-Z0-9-]/g, '_')),
    })

    const safeName = String(iss.employeeName).replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${iss.ref}_${safeName}_Executed.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[issuance] executed pack failed:', e)
    return NextResponse.json({ error: (e as Error)?.message || 'Could not build the executed pack' }, { status: 500 })
  }
}
