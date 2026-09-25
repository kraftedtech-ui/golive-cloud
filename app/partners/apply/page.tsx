import { Plus_Jakarta_Sans } from 'next/font/google'
import { PARTNER_CSS } from '@/components/partners/styles'
import { PartnerHeader, PartnerFooter } from '@/components/partners/Shell'
import PartnerApplyForm from '@/components/partners/PartnerApplyForm'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: 'Apply | GoLive Partner Network',
  description: 'Apply to join the GoLive Partner Network as a Referral Partner or Sales Partner.',
}

export default function PartnerApplyPage() {
  return (
    <div className={`${jakarta.variable} gp`}>
      <style>{PARTNER_CSS}</style>
      <PartnerHeader />
      <main className="gp-page gp-narrow">
        <div style={{ marginBottom: 20 }}>
          <a href="/partners" style={{ fontSize: 13 }}>Partner Network</a>
          <h1 style={{ marginTop: 6 }}>Partner application</h1>
          <p className="gp-lede">
            About 15 minutes. Submitting creates no appointment or authority; it starts the accreditation process.
          </p>
        </div>
        <PartnerApplyForm />
      </main>
      <PartnerFooter />
    </div>
  )
}
