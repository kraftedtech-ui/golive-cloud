import { Plus_Jakarta_Sans } from 'next/font/google'
import { connectDB } from '@/lib/mongodb'
import PartnerApplication from '@/models/PartnerApplication'
import { certStatus } from '@/lib/partnerCertificate'
import { PARTNER_CSS } from '@/components/partners/styles'
import { PartnerHeader, PartnerFooter } from '@/components/partners/Shell'
import VerifyLookup from '@/components/partners/VerifyLookup'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Certificate verification | GoLive Partner Network', robots: { index: false, follow: false } }

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-jakarta', display: 'swap' })
const long = (d: Date | string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })

type Cert = { number: string; title: string; issuedAt: Date; expiresAt: Date; test?: boolean; revokedAt?: Date }

/**
 * Public: confirms whether a certificate is current. Shows only what the
 * certificate itself shows (name, title, numbers, dates), never contact
 * details, and never why a certificate was revoked.
 */
export default async function VerifyCertificate({ params }: { params: Promise<{ cert: string }> }) {
  const { cert } = await params
  const number = decodeURIComponent(cert).trim().toUpperCase().slice(0, 40)
  let found: { name: string; partnerNumber?: string; c: Cert } | null = null
  if (/^GL-CERT-(TEST-)?\d{4}-\d{3,}$/.test(number)) {
    await connectDB()
    const app = (await PartnerApplication.findOne({ 'certificate.number': number }).select('applicant.name partnerNumber certificate').lean()) as
      { applicant: { name: string }; partnerNumber?: string; certificate: Cert } | null
    if (app?.certificate) found = { name: app.applicant.name, partnerNumber: app.partnerNumber, c: app.certificate }
  }
  const status = found ? certStatus(found.c) : null
  const tone = status === 'valid' && !found?.c.test ? 'var(--ok)' : 'var(--danger)'
  const heading = !found ? 'No certificate found'
    : found.c.test ? 'Test certificate: not valid'
    : status === 'valid' ? 'This certificate is valid'
    : status === 'expired' ? 'This certificate has expired'
    : 'This certificate has been revoked'

  return (
    <div className={`${jakarta.variable} gp`}>
      <style>{PARTNER_CSS}</style>
      <PartnerHeader />
      <main className="gp-page gp-narrow">
        <section className="gp-pane" style={{ borderTop: `4px solid ${tone}` }}>
          <p className="gp-muted" style={{ margin: 0 }}>GoLive Partner Network certificate verification</p>
          <h1 style={{ fontSize: 30, lineHeight: '36px', color: tone, marginTop: 6 }}>{heading}</h1>
          {!found && (
            <p className="gp-lede">No GoLive certificate matches <strong>{number || 'that number'}</strong>. Check the number and try again, or contact <a href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a>.</p>
          )}
          {found && (
            <>
              <dl className="gp-review" style={{ marginTop: 16 }}>
                <dt>Name</dt><dd><strong>{found.name}</strong></dd>
                <dt>Accreditation</dt><dd>{found.c.title}</dd>
                <dt>Certificate number</dt><dd>{found.c.number}</dd>
                <dt>Partner number</dt><dd>{found.partnerNumber}</dd>
                <dt>Issued</dt><dd>{long(found.c.issuedAt)}</dd>
                <dt>{status === 'expired' ? 'Expired' : 'Valid until'}</dt><dd>{long(found.c.expiresAt)}</dd>
                {found.c.revokedAt && <><dt>Revoked</dt><dd>{long(found.c.revokedAt)}</dd></>}
                <dt>Issued by</dt><dd>The GoLive Digital Solutions Company Ltd, RC1644767</dd>
              </dl>
              <p className="gp-muted" style={{ marginTop: 16 }}>
                {status === 'valid' && !found.c.test
                  ? 'The holder has completed GoLive\u2019s partner accreditation, including anti-bribery training. Partners introduce GoLive solutions; every sale is contracted and invoiced by GoLive, and partners hold no authority to sign, set prices or commit on behalf of GoLive or any vendor.'
                  : 'The holder is not currently a certified GoLive partner. Please do not rely on this certificate.'}
              </p>
            </>
          )}
        </section>
        <section className="gp-pane">
          <h2 style={{ fontSize: 18 }}>Check another certificate</h2>
          <VerifyLookup />
        </section>
      </main>
      <PartnerFooter />
    </div>
  )
}
