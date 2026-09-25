import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import PartnerApplication from '@/models/PartnerApplication'
import { verifyPartnerToken } from '@/lib/partnerToken'
import { buildAgreementDoc } from '@/lib/partnerAgreement'
import { agreementView } from '@/lib/partnerAgreementFlow'
import { renderBrandedPdf } from '@/lib/brandedDocument'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET ?id=<application id>  admin session: any stage, including a preview before sending
// GET ?token=<pdoc token>   partner: the fully executed agreement only
// GET ?sign=<pagree token>   partner: the agreement they are being asked to sign, before or after signing
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const token = req.nextUrl.searchParams.get('token')
  const sign = req.nextUrl.searchParams.get('sign')
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
  } else if (sign) {
    const v = verifyPartnerToken('pagree', sign)
    if (!v) return NextResponse.json({ error: 'This link is not valid or has expired.' }, { status: 401 })
    await connectDB()
    app = await PartnerApplication.findOne({ ref: v.ref })
    if (app && (!app.agreement?.sentAt || ['declined', 'withdrawn'].includes(app.status))) return NextResponse.json({ error: 'No agreement is waiting for this link.' }, { status: 404 })
  } else {
    return NextResponse.json({ error: 'id, token or sign required' }, { status: 400 })
  }
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const pdf = await renderBrandedPdf(buildAgreementDoc(agreementView(app)))
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
