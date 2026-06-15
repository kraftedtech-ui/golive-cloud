'use client'

const NAVY = '#0d2233'
const TEAL = '#00c8c8'
const CY = '#0096c7'
const BORDER = '#c8e6f0'
const LIGHT = '#e8f4fb'
const MUTED = '#5a7a8a'
const GRAY = '#f4fafd'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, borderBottom: `3px solid ${CY}`, paddingBottom: 8, marginBottom: 16 }}>{title}</h2>
      {children}
    </section>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: CY, marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: '#333', lineHeight: 1.8, marginBottom: 10 }}>{children}</p>
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 24, marginBottom: 10 }}>
      {items.map((item, i) => <li key={i} style={{ fontSize: 14, color: '#333', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>)}
    </ul>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: LIGHT, borderLeft: `4px solid ${CY}`, borderRadius: '0 8px 8px 0', padding: '14px 18px', marginBottom: 16, fontSize: 13, color: NAVY, lineHeight: 1.7, fontStyle: 'italic' }}>
      {children}
    </div>
  )
}

export default function TermsPage() {
  return (
    <div style={{ fontFamily: 'Segoe UI, system-ui, sans-serif', background: '#fff', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ background: NAVY, padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="30" viewBox="0 0 52 50" fill="none"><defs><linearGradient id="sw" x1="10" y1="38" x2="44" y2="6" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00c8c8"/><stop offset="100%" stopColor="#00b4d8"/></linearGradient></defs><path d="M12 38 Q16 18 44 8" stroke="url(#sw)" strokeWidth="4.5" strokeLinecap="round" fill="none"/><circle cx="14" cy="34" r="5" fill="#00c8c8"/><line x1="14" y1="34" x2="3" y2="40" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/><line x1="14" y1="34" x2="2" y2="32" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/><line x1="14" y1="34" x2="4" y2="24" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <div><span style={{ color: '#00b4d8', fontSize: 18, fontWeight: 700 }}>go</span><span style={{ color: TEAL, fontSize: 18, fontWeight: 700 }}>live</span></div>
        </a>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none', fontSize: 13 }}>Home</a>
          <a href="/privacy" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none', fontSize: 13 }}>Privacy Policy</a>
          <a href="/portal/login" style={{ background: CY, color: '#fff', textDecoration: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>Portal login</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: NAVY, padding: '48px 48px 40px', borderBottom: `3px solid ${CY}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>Legal</div>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 10px' }}>Terms of Service</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, margin: 0 }}>Effective date: 15 June 2026 &nbsp;·&nbsp; Version 1.0 &nbsp;·&nbsp; The GoLive Digital Solutions Company Ltd.</p>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>

        <InfoBox>
          These Terms of Service govern your use of GoLive Digital Solutions cloud services, including Microsoft 365 licensing, migration services, managed support, and the GoLive Cloud Marketplace at cloud.golivecompany.com. By engaging GoLive services or submitting an assessment request, you agree to these Terms. These Terms comply with the Nigeria Data Protection Act (NDPA) 2023 and the General Application and Implementation Directive (GAID) 2025.
        </InfoBox>

        <Section title="1. Definitions">
          <P><strong>"GoLive"</strong> or <strong>"Company"</strong> means The GoLive Digital Solutions Company Ltd., incorporated in Nigeria (RC1644767), with registered office at 7 Ibiyinka Olorunbe Close, Victoria Island, Lagos 106104, Nigeria. Authorized Microsoft Indirect Reseller, CSP Partner ID: 6787357.</P>
          <P><strong>"Client"</strong> or <strong>"You"</strong> means the business, organisation or individual engaging GoLive for cloud services.</P>
          <P><strong>"Services"</strong> means all Microsoft 365 licensing, email migration, security configuration, training, managed support, and any other cloud services provided by GoLive.</P>
          <P><strong>"Microsoft Products"</strong> means software, subscriptions and services provided by Microsoft Corporation and resold by GoLive as an authorized Microsoft Indirect Reseller.</P>
          <P><strong>"Platform"</strong> means the GoLive Cloud Marketplace available at cloud.golivecompany.com.</P>
          <P><strong>"NDPA"</strong> means the Nigeria Data Protection Act 2023 and the General Application and Implementation Directive (GAID) issued by the Nigeria Data Protection Commission (NDPC) in March 2025.</P>
        </Section>

        <Section title="2. Services Provided">
          <Sub title="2.1 Microsoft 365 Licensing">
            <P>GoLive resells Microsoft 365 subscriptions as an authorized Microsoft Indirect Reseller (Partner ID: 6787357). Microsoft 365 licenses are subject to Microsoft's own terms at microsoft.com/licensing. GoLive acts as your CSP and is responsible for billing, support and license management on your behalf.</P>
          </Sub>
          <Sub title="2.2 Migration Services">
            <P>GoLive provides email migration, domain configuration, DNS setup, and data transfer services from existing providers (cPanel, Google Workspace, Zoho and others) to Microsoft 365. GoLive maintains backups of all client data prior to migration commencement. You will not lose any emails during a GoLive-managed migration.</P>
          </Sub>
          <Sub title="2.3 Security Configuration">
            <P>GoLive configures Microsoft 365 security settings including Multi-Factor Authentication (MFA), SPF, DKIM, DMARC, anti-phishing policies and Microsoft Defender for Business as included in your agreed package. Security configuration follows Microsoft best practice recommendations.</P>
          </Sub>
          <Sub title="2.4 Managed Support">
            <P>Monthly managed support is provided in accordance with the GoLive Service Level Agreement (SLA) applicable to your package tier. GoLive reserves the right to update support terms with 30 days written notice.</P>
          </Sub>
          <Sub title="2.5 Training">
            <P>GoLive provides Microsoft 365 user and admin training as part of the onboarding package. Additional training sessions beyond initial onboarding are available at GoLive's standard daily rate.</P>
          </Sub>
        </Section>

        <Section title="3. Client Obligations">
          <P>By engaging GoLive services, you agree to:</P>
          <UL items={[
            'Provide accurate and complete information when submitting assessment forms or service requests',
            'Designate a primary IT contact available during migration and setup activities',
            'Provide access to existing email systems, DNS records and domain registrar accounts as required',
            'Ensure all users complete Multi-Factor Authentication (MFA) enrollment within 14 days of account setup',
            'Not share Microsoft 365 admin credentials with unauthorised parties',
            'Promptly notify GoLive of any suspected security incidents or unauthorised access',
            'Pay invoices within the agreed payment terms',
            'Comply with Microsoft\'s acceptable use policies and terms of service',
            'Not use Microsoft 365 services for any unlawful purpose',
          ]} />
        </Section>

        <Section title="4. Fees and Payment">
          <Sub title="4.1 Pricing">
            <P>GoLive fees are set out in the agreed proposal. Prices are quoted in USD and may be invoiced in local currency (NGN, GHS, KES, ZAR) at the prevailing exchange rate at the time of invoicing. GoLive reserves the right to adjust pricing with 30 days written notice.</P>
          </Sub>
          <Sub title="4.2 Microsoft License Fees">
            <P>Microsoft 365 subscription fees are billed monthly or annually as agreed. Annual subscriptions are billed upfront. Microsoft may adjust license pricing and such changes will be passed on to the Client.</P>
          </Sub>
          <Sub title="4.3 Setup Fees">
            <P>One-time setup and migration fees are due prior to commencement of migration. Setup fees are non-refundable once migration work has commenced.</P>
          </Sub>
          <Sub title="4.4 Payment Terms">
            <P>Invoices are due within 14 days of issue. Late payment may result in suspension of services. GoLive reserves the right to charge interest on overdue amounts at 2% per month.</P>
          </Sub>
        </Section>

        <Section title="5. Data Protection and NDPA Compliance">
          <InfoBox>
            GoLive operates in compliance with the Nigeria Data Protection Act (NDPA) 2023 and the General Application and Implementation Directive (GAID) effective September 2025. As your data processor for migration services and your CSP for Microsoft 365, GoLive processes personal data only as necessary to deliver the agreed services.
          </InfoBox>
          <Sub title="5.1 Data Processing">
            <P>GoLive processes Client personal data strictly for the purpose of delivering agreed services. GoLive does not sell, share or disclose Client data to third parties except as required to deliver services (e.g., to Microsoft Corporation) or as required by Nigerian law.</P>
          </Sub>
          <Sub title="5.2 Data Subject Rights">
            <P>Under the NDPA 2023, your staff and contacts whose data we process have the right to access, correct, delete, restrict processing of, and receive a copy of their personal data. Requests may be directed to contact@golivecompany.com.</P>
          </Sub>
          <Sub title="5.3 Data Security">
            <P>GoLive implements appropriate technical and organisational measures to protect personal data in accordance with NDPA requirements, including encryption, access controls, and incident response procedures.</P>
          </Sub>
          <P>For full details of GoLive's data practices, see our <a href="/privacy" style={{ color: CY }}>Privacy Policy</a>.</P>
        </Section>

        <Section title="6. Microsoft Licensing Terms">
          <P>The Client acknowledges that:</P>
          <UL items={[
            'Microsoft 365 subscriptions are governed by Microsoft\'s Customer Agreement and Product Terms',
            'GoLive is acting as a Microsoft Indirect Reseller and not as an agent of Microsoft Corporation',
            'Microsoft Corporation is not a party to this Agreement and has no liability to the Client under these Terms',
            'Certain Microsoft features may be unavailable in specific African markets',
            'Microsoft may modify, discontinue or alter products and services with notice',
          ]} />
        </Section>

        <Section title="7. Warranties and Disclaimers">
          <Sub title="7.1 GoLive Warranties">
            <P>GoLive warrants that services will be performed with reasonable skill and care, and that GoLive holds valid Microsoft Partner Center credentials as an authorized Indirect Reseller.</P>
          </Sub>
          <Sub title="7.2 Disclaimers">
            <P>GoLive does not warrant that Microsoft 365 services will be available without interruption, that security measures will prevent all cyber threats, or that migration will be completed within a specific timeframe if the Client fails to provide required access or information.</P>
          </Sub>
        </Section>

        <Section title="8. Limitation of Liability">
          <UL items={[
            'GoLive\'s total liability shall not exceed the total fees paid by the Client in the three months preceding the claim',
            'GoLive shall not be liable for indirect, consequential, special or punitive damages including loss of profits or loss of data',
            'GoLive shall not be liable for Microsoft service outages, internet disruptions, force majeure events or acts of government',
          ]} />
        </Section>

        <Section title="9. Termination">
          <Sub title="9.1 Termination by Client">
            <P>The Client may terminate monthly subscriptions with 30 days written notice to contact@golivecompany.com. Annual subscriptions may be cancelled but are not refundable for the remaining subscription period.</P>
          </Sub>
          <Sub title="9.2 Termination by GoLive">
            <P>GoLive may terminate services with 30 days written notice, or immediately if the Client fails to pay invoices after 30 days, breaches Microsoft's acceptable use policy, or engages in fraudulent or unlawful activity.</P>
          </Sub>
          <Sub title="9.3 CSP Transfer on Termination">
            <P>GoLive will provide reasonable assistance with CSP transfer to another provider for 30 days following termination notice. Your Microsoft 365 data and licenses are not lost upon termination.</P>
          </Sub>
        </Section>

        <Section title="10. Dispute Resolution">
          <P>The parties agree to attempt to resolve any dispute informally by contacting GoLive at contact@golivecompany.com. If not resolved within 30 days, either party may refer the matter to mediation or arbitration under the rules of the Lagos Court of Arbitration. These Terms are governed by the laws of the Federal Republic of Nigeria.</P>
        </Section>

        <Section title="11. Amendments">
          <P>GoLive may update these Terms from time to time. Updated Terms will be posted at cloud.golivecompany.com/terms. Continued use of GoLive services after the effective date constitutes acceptance of the updated Terms.</P>
        </Section>

        <Section title="12. Contact">
          <div style={{ background: GRAY, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
            <P><strong>The GoLive Digital Solutions Company Ltd.</strong></P>
            <P>RC1644767 &nbsp;·&nbsp; Microsoft CSP Partner ID: 6787357</P>
            <P>7 Ibiyinka Olorunbe Close, Victoria Island, Lagos 106104, Nigeria</P>
            <P>Email: <a href="mailto:contact@golivecompany.com" style={{ color: CY }}>contact@golivecompany.com</a></P>
            <P>WhatsApp: <a href="https://wa.me/2348083587801" style={{ color: CY }}>+234 808 358 7801</a></P>
            <P>Website: <a href="https://cloud.golivecompany.com" style={{ color: CY }}>cloud.golivecompany.com</a></P>
          </div>
        </Section>

      </div>

      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: '32px 48px', borderTop: `3px solid ${CY}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, marginBottom: 6 }}>
              © 2026 The GoLive Digital Solutions Company Ltd. · RC1644767 · All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="/terms" style={{ color: TEAL, fontSize: 12, textDecoration: 'none' }}>Terms of Service</a>
              <a href="/privacy" style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/" style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, textDecoration: 'none' }}>Home</a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/images/ndpr-badge.png" alt="NDPR Compliance" style={{ height: 48, width: 'auto' }} />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', maxWidth: 160, lineHeight: 1.5 }}>
              Compliant with Nigeria Data Protection Act (NDPA) 2023 & GAID 2025
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
