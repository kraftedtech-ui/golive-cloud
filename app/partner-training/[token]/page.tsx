import { Plus_Jakarta_Sans } from 'next/font/google'
import { PARTNER_CSS } from '@/components/partners/styles'
import { PartnerHeader, PartnerFooter } from '@/components/partners/Shell'
import TrainingClient from '@/components/partners/TrainingClient'

export const dynamic = 'force-dynamic'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: 'Partner training | GoLive Partner Network',
  robots: { index: false, follow: false },
}

export default async function PartnerTrainingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <div className={`${jakarta.variable} gp`}>
      <style>{PARTNER_CSS}</style>
      <PartnerHeader />
      <main className="gp-page gp-narrow">
        <TrainingClient token={token} />
      </main>
      <PartnerFooter />
    </div>
  )
}
