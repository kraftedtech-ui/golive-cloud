import { Plus_Jakarta_Sans } from 'next/font/google'
import { connectDB } from '@/lib/mongodb'
import PartnerApplication from '@/models/PartnerApplication'
import { verifyPartnerToken } from '@/lib/partnerToken'
import { buildAgreementHtml } from '@/lib/partnerAgreement'
import { agreementView } from '@/lib/partnerAgreementFlow'
import { PARTNER_CSS } from '@/components/partners/styles'
import { PartnerHeader, PartnerFooter } from '@/components/partners/Shell'
import AgreementSignForm from '@/components/partners/AgreementSignForm'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Partner agreement | GoLive Partner Network', robots: { index: false, follow: false } }

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-jakarta', display: 'swap' })

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.variable} gp`}>
      <style>{PARTNER_CSS}</style>
      <PartnerHeader />
      <main className="gp-page gp-narrow">{children}</main>
      <PartnerFooter />
    </div>
  )
}

export default async function PartnerAgreementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const v = verifyPartnerToken('pagree', token)
  if (!v) {
    return (
      <Frame>
        <section className="gp-pane"><h1 style={{ fontSize: 28, lineHeight: '34px' }}>This link is not valid or has expired</h1>
          <p className="gp-lede">Please email <a href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a> and we will send you a new one.</p></section>
      </Frame>
    )
  }
  await connectDB()
  const app = await PartnerApplication.findOne({ ref: v.ref })
  if (!app || !app.agreement?.sentAt || ['declined', 'withdrawn'].includes(app.status)) {
    return (
      <Frame>
        <section className="gp-pane"><h1 style={{ fontSize: 28, lineHeight: '34px' }}>No agreement is waiting for this link</h1>
          <p className="gp-lede">Please email <a href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a>.</p></section>
      </Frame>
    )
  }
  const html = buildAgreementHtml(agreementView(app))
  return (
    <Frame>
      <section className="gp-pane" style={{ padding: '32px 36px' }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <AgreementSignForm
          token={token}
          partnerName={app.applicant.name}
          signedAt={app.agreement.partnerSignedAt ? new Date(app.agreement.partnerSignedAt).toISOString() : null}
          executed={!!app.agreement.mdSignedAt}
        />
      </section>
    </Frame>
  )
}
