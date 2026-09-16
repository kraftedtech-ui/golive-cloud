import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { buildExecutedPack } from '@/lib/executedPack'
import { OFFER_CONFIG } from '@/lib/offerConfig'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Admin: download the executed onboarding pack as one merged PDF —
// certificate of acknowledgement, then each PDF document with its own
// execution page. Available once both parties have signed.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const ref = new URL(req.url).searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  await connectDB()
  const app = (await Application.findOne({ ref }).lean()) as any
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const ob = app.onboarding
  if (!ob?.acknowledgedAt) {
    return NextResponse.json({ error: 'The hire has not signed the pack yet.' }, { status: 409 })
  }
  if (!ob.mdAckAt) {
    return NextResponse.json({ error: 'Countersign the pack before downloading the executed copy.' }, { status: 409 })
  }

  try {
    const pdf = await buildExecutedPack({
      ref: app.ref,
      name: app.name,
      role: app.role,
      employeeNumber: app.employeeNumber,
      jobCode: app.offer?.jobCode || OFFER_CONFIG[app.role]?.jobCode,
      docs: (ob.docs || []).map((d: any) => ({
        filename: d.filename,
        label: d.label || d.filename,
        acknowledgedAt: d.acknowledgedAt || ob.acknowledgedAt,
      })),
      signatureName: ob.signatureName || ob.acknowledgedName || app.name,
      signedAt: ob.acknowledgedAt,
      ip: ob.ip,
      mdAckName: ob.mdAckName || 'Adeniyi Olayemi',
      mdAckAt: ob.mdAckAt,
      docsDir: path.join(process.cwd(), 'onboarding-docs', String(app.ref).replace(/[^a-zA-Z0-9-]/g, '_')),
    })

    const safeName = String(app.name).replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${app.ref}_${safeName}_ExecutedPack.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[executed] build failed:', e)
    return NextResponse.json({ error: 'Could not build the executed pack' }, { status: 500 })
  }
}
