import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin, requireRole, forbiddenAction } from '@/lib/apiAuth'
import PartnerApplication from '@/models/PartnerApplication'
import { verifyPartnerToken } from '@/lib/partnerToken'
import { buildCertificateHtml, renderCertificatePdf, certStatus } from '@/lib/partnerCertificate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET ?id=<application id>  admin session: always, stamped REVOKED if revoked
// GET ?token=<pdoc token>   partner: only while the certificate is not revoked
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const token = req.nextUrl.searchParams.get('token')
  let app
  let admin = false
  if (id) {
    const auth = await requireRole(['admin', 'operations'])
    if (auth instanceof NextResponse) return auth
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await connectDB()
    app = await PartnerApplication.findById(id)
    admin = true
  } else if (token) {
    const v = verifyPartnerToken('pdoc', token)
    if (!v) return NextResponse.json({ error: 'This link is not valid or has expired.' }, { status: 401 })
    await connectDB()
    app = await PartnerApplication.findOne({ ref: v.ref })
  } else {
    return NextResponse.json({ error: 'id or token required' }, { status: 400 })
  }
  const c = app?.certificate
  if (!app || !c?.number) return NextResponse.json({ error: 'No certificate has been issued.' }, { status: 404 })
  const status = certStatus(c)
  if (!admin && status === 'revoked') return NextResponse.json({ error: 'This certificate has been revoked.' }, { status: 410 })

  try {
    const html = await buildCertificateHtml({
      name: app.applicant.name, title: c.title, number: c.number, partnerNumber: app.partnerNumber || '',
      issuedAt: c.issuedAt, expiresAt: c.expiresAt, test: !!c.test, revoked: status === 'revoked',
    })
    const pdf = await renderCertificatePdf(html)
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${c.number}.pdf"`, 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    console.error('[partner-certificate] pdf render failed:', e)
    return NextResponse.json({ error: 'PDF render failed' }, { status: 500 })
  }
}
