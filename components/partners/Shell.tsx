import { PARTNER_EMAIL } from '@/lib/partnerConfig'

/** Header and footer shared by the public Partner Network pages. */
export function PartnerHeader() {
  return (
    <header className="gp-header">
      <div className="gp-header-inner">
        <a href="/partners" className="gp-brand" aria-label="GoLive Partner Network">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/golive-logo.png" alt="GoLive Digital Solutions Company" />
        </a>
        <span className="gp-sep" aria-hidden="true" />
        <span className="gp-section">Partner Network</span>
        <a className="gp-contact" href="/partner">Partner sign-in</a>
      </div>
    </header>
  )
}

export function PartnerFooter() {
  return (
    <footer className="gp-footer">
      <div className="gp-footer-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/golive-logo.png" alt="" />
        <span>The GoLive Digital Solutions Company Ltd, RC1644767</span>
        <span>Lagos, Nigeria</span>
        <a href="/privacy">Privacy Policy</a>
        <a href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a>
      </div>
    </footer>
  )
}
