import { Plus_Jakarta_Sans } from 'next/font/google'
import { PARTNER_CSS } from '@/components/partners/styles'
import { PartnerHeader, PartnerFooter } from '@/components/partners/Shell'
import { SOLUTIONS, CATEGORY_INFO } from '@/lib/partnerConfig'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: 'Partner with GoLive | GoLive Digital Solutions',
  description:
    'Join the GoLive Partner Network. Introduce or sell GoLive technology solutions to businesses you know, and earn commission on every sale GoLive makes.',
}

const STEPS: [string, string][] = [
  ['Apply', 'Online, about 15 minutes. Your answers are saved on your device as you go.'],
  ['Review', 'We review your application and the organisations you list within five working days.'],
  ['Interview', 'A short conversation with the Managing Director.'],
  ['Training', 'Four online modules, including anti-bribery and business integrity.'],
  ['Assessment', 'Online, without camera recording. What is monitored is shown before you start.'],
  ['Agreement', 'Signed online and countersigned by GoLive. Your partner number is issued.'],
  ['Certified', 'A GoLive certificate you can add to LinkedIn, verifiable online by anyone.'],
]

export default function PartnersPage() {
  return (
    <div className={`${jakarta.variable} gp`}>
      <style>{PARTNER_CSS}</style>
      <PartnerHeader />

      <main className="gp-page">
        <div className="gp-hero">
          <section className="gp-pane gp-hero-main">
            <span className="gp-tag">GoLive Partner Network</span>
            <h1 style={{ marginTop: 14 }}>Bring us the relationships. We deliver the technology.</h1>
            <p className="gp-lede">
              The GoLive Partner Network is for independent professionals who know the people who make technology
              decisions in their organisations. You make the introduction, GoLive delivers and supports the solution,
              and you earn commission on every sale we make.
            </p>
            <div className="gp-actions">
              <a className="gp-btn gp-primary gp-lg" href="/partners/apply">Apply to become a partner</a>
              <a className="gp-btn gp-lg" href="#how">How it works</a>
            </div>
          </section>
          <aside className="gp-pane gp-hero-side" aria-label="Key terms">
            <div className="gp-fact"><b>No cost to join</b><span>No fee and no sales target. You set your own hours.</span></div>
            <div className="gp-fact"><b>Paid on cash received</b><span>Commission is paid within 30 days of the client&rsquo;s payment clearing.</span></div>
            <div className="gp-fact"><b>Recurring income</b><span>Renewal commission on subscriptions and support contracts while the account is retained.</span></div>
            <div className="gp-fact"><b>Your introductions are protected</b><span>Registered accounts are held for you for 90 days, extended by recorded activity.</span></div>
          </aside>
        </div>

        <section className="gp-pane" aria-labelledby="cat-h">
          <h2 id="cat-h">Two ways to partner</h2>
          <div className="gp-grid2">
            {(['referral', 'sales'] as const).map((k) => (
              <div className="gp-card" key={k}>
                <h3>{CATEGORY_INFO[k].label}</h3>
                <span className="gp-tag">{CATEGORY_INFO[k].short}</span>
                <p>{CATEGORY_INFO[k].detail}</p>
              </div>
            ))}
          </div>
          <p className="gp-muted" style={{ marginTop: 12 }}>
            The commission schedule for each category is shared with applicants at interview.
          </p>
        </section>

        <section className="gp-pane" aria-labelledby="sell-h">
          <h2 id="sell-h">What you can introduce</h2>
          <ul className="gp-list" style={{ columns: 2, columnGap: 32 }}>
            {SOLUTIONS.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>

        <section className="gp-pane" id="how" aria-labelledby="how-h">
          <h2 id="how-h">How accreditation works</h2>
          <ol className="gp-steps">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="gp-step">
                <span className="gp-step-n" aria-hidden="true">{i + 1}</span>
                <b>{t}</b>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="gp-pane" aria-labelledby="rules-h">
          <h2 id="rules-h">How every sale is made</h2>
          <div className="gp-rules">
            <div className="gp-rule"><b>GoLive contracts with the client</b>Every sale is made, quoted and invoiced by GoLive. Partners never contract with or invoice the client.</div>
            <div className="gp-rule"><b>Partners hold no authority</b>Partners may not sign, set prices, offer discounts or make commitments on behalf of GoLive or any vendor.</div>
            <div className="gp-rule"><b>Integrity comes first</b>Anti-bribery training and a written undertaking are required of every partner before appointment.</div>
          </div>
          <div className="gp-actions">
            <a className="gp-btn gp-primary gp-lg" href="/partners/apply">Start your application</a>
          </div>
          <p className="gp-muted" style={{ marginTop: 16 }}>
            Personal data in partner applications is processed under the Nigeria Data Protection Act 2023 and
            our <a href="/privacy">Privacy Policy</a>.
          </p>
        </section>
      </main>

      <PartnerFooter />
    </div>
  )
}
