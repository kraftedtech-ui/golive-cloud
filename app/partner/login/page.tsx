import { redirect } from 'next/navigation'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { PARTNER_CSS } from '@/components/partners/styles'
import { PartnerHeader, PartnerFooter } from '@/components/partners/Shell'
import PartnerLogin from '@/components/partners/PartnerLogin'
import { currentPartner } from '@/lib/partnerSession'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Partner sign-in | GoLive Partner Network', robots: { index: false, follow: false } }

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-jakarta', display: 'swap' })

export default async function PartnerLoginPage() {
  if (await currentPartner()) redirect('/partner')
  return (
    <div className={`${jakarta.variable} gp`}>
      <style>{PARTNER_CSS}</style>
      <PartnerHeader />
      <main className="gp-page"><PartnerLogin /></main>
      <PartnerFooter />
    </div>
  )
}
