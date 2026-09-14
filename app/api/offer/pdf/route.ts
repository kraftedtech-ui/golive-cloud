import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { verifyOfferToken } from '@/lib/offerToken'
import { buildOfferHtml } from '@/lib/offerLetter'
import { renderPdfFromHtml, archiveHeaderTemplate } from '@/lib/renderPdf'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET ?ref=GL-APP-...   (admin session)  — any stage
// GET ?token=...        (candidate link) — after full execution only
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const refParam = url.searchParams.get('ref')
  const tokenParam = url.searchParams.get('token')

  let ref: string | null = null
  let requireExecuted = false

  if (refParam) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
    ref = refParam
  } else if (tokenParam) {
    const v = verifyOfferToken(tokenParam)
    if (!v) return NextResponse.json({ error: 'Link invalid or expired' }, { status: 401 })
    ref = v.ref
    requireExecuted = true
  } else {
    return NextResponse.json({ error: 'ref or token required' }, { status: 400 })
  }

  await connectDB()
  const app = (await Application.findOne({ ref }).lean()) as any
  if (!app || !app.offer || !app.offer.sentAt) {
    return NextResponse.json({ error: 'No offer on record' }, { status: 404 })
  }
  if (requireExecuted && !app.offer.mdSignedAt) {
    return NextResponse.json({ error: 'The offer is not yet fully executed.' }, { status: 409 })
  }

  const html = buildOfferHtml({
    ref: app.ref, name: app.name, email: app.email, role: app.role,
    jobCode: app.offer.jobCode, salary: app.offer.salary, startDate: app.offer.startDate,
    deadline: app.offer.deadline, sentAt: app.offer.sentAt,
    candidateSignedAt: app.offer.candidateSignedAt, candidateSignedName: app.offer.candidateSignedName,
    candidateIp: app.offer.candidateIp, mdSignedAt: app.offer.mdSignedAt, mdSignedName: app.offer.mdSignedName,
  })

  try {
    const pdf = await renderPdfFromHtml(
      `<div style="padding:0 2mm">${html}</div>`,
      archiveHeaderTemplate('GoLive Digital Solutions \u2014 Offer of Employment', app.ref)
    )
    const safeName = String(app.name).replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${app.ref}_${safeName}_offer.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[offer] pdf render failed:', e)
    return NextResponse.json({ error: 'PDF render failed' }, { status: 500 })
  }
}
