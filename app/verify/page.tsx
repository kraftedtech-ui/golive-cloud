import { Plus_Jakarta_Sans } from 'next/font/google'
import { PARTNER_CSS } from '@/components/partners/styles'
import { PartnerHeader, PartnerFooter } from '@/components/partners/Shell'
import VerifyLookup from '@/components/partners/VerifyLookup'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-jakarta', display: 'swap' })

export const metadata = { title: 'Verify a certificate | GoLive Partner Network' }

export default function VerifyIndex() {
  return (
    <div className={`${jakarta.variable} gp`}>
      <style>{PARTNER_CSS}</style>
      <PartnerHeader />
      <main className="gp-page gp-narrow">
        <section className="gp-pane">
          <h1 style={{ fontSize: 30, lineHeight: '36px' }}>Verify a GoLive partner certificate</h1>
          <p className="gp-lede" style={{ marginBottom: 18 }}>Enter the certificate number shown on the certificate, or scan its QR code, to confirm whether it is current.</p>
          <VerifyLookup />
        </section>
      </main>
      <PartnerFooter />
    </div>
  )
}
