import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import PartnerApplication from '@/models/PartnerApplication'
import { verifyPartnerToken } from '@/lib/partnerToken'
import { buildAgreementHtml } from '@/lib/partnerAgreement'
import { agreementView } from '@/lib/partnerAgreementFlow'
import { renderPdfFromHtml, archiveHeaderTemplate } from '@/lib/renderPdf'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET ?id=<application id>  admin session: any stage, including a preview before sending
// GET ?token=<pdoc token>   partner: the fully executed agreement only
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const token = req.nextUrl.searchParams.get('token')
  let app
  if (id) {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await connectDB()
    app = await PartnerApplication.findById(id)
  } else if (token) {
    const v = verifyPartnerToken('pdoc', token)
    if (!v) return NextResponse.json({ error: 'This link is not valid or has expired.' }, { status: 401 })
    await connectDB()
    app = await PartnerApplication.findOne({ ref: v.ref })
    if (app && !app.agreement?.mdSignedAt) return NextResponse.json({ error: 'The agreement is not yet fully executed.' }, { status: 409 })
  } else {
    return NextResponse.json({ error: 'id or token required' }, { status: 400 })
  }
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const html = buildAgreementHtml(agreementView(app))
  try {
    const pdf = await renderPdfFromHtml(`<div style="padding:0 2mm">${html}</div>`, archiveHeaderTemplate('GoLive Independent Sales Partner Agreement', app.partnerNumber || app.ref))
    const safe = String(app.applicant.name).replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${app.partnerNumber || app.ref}_${safe}_partner_agreement${app.agreement?.mdSignedAt ? '' : '_draft'}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[partner-agreement] pdf render failed:', e)
    return NextResponse.json({ error: 'PDF render failed' }, { status: 500 })
  }
}
