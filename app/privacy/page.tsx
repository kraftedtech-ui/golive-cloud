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

function RightsCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: '14px', borderTop: `3px solid ${CY}` }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{desc}</div>
    </div>
  )
}

export default function PrivacyPage() {
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
          <a href="/terms" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none', fontSize: 13 }}>Terms of Service</a>
          <a href="/portal/login" style={{ background: CY, color: '#fff', textDecoration: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>Portal login</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: NAVY, padding: '48px 48px 40px', borderBottom: `3px solid ${CY}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>Legal</div>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 10px' }}>Privacy Policy</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, margin: '0 0 20px' }}>Effective date: 15 June 2026 &nbsp;·&nbsp; Version 1.0 &nbsp;·&nbsp; The GoLive Digital Solutions Company Ltd.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '12px 16px', width: 'fit-content' }}>
            <img src="/images/ndpr-badge.png" alt="NDPR Compliance" style={{ height: 44, width: 'auto' }} />
            <div>
              <div style={{ color: TEAL, fontSize: 12, fontWeight: 700 }}>NDPA 2023 & GAID 2025 Compliant</div>
              <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>Nigeria Data Protection Commission (NDPC)</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>

        <InfoBox>
          This Privacy Policy explains how The GoLive Digital Solutions Company Ltd. ("GoLive", "we", "us" or "our") collects, uses, stores and protects your personal information. We are committed to protecting your privacy in full compliance with the Nigeria Data Protection Act (NDPA) 2023 and the General Application and Implementation Directive (GAID) issued by the Nigeria Data Protection Commission (NDPC) in March 2025, which is effective from September 2025.
        </InfoBox>

        {/* YOUR RIGHTS QUICK CARDS */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Your data rights at a glance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            <RightsCard icon="👁" title="Right to access" desc="Request a copy of the personal data we hold about you" />
            <RightsCard icon="✏️" title="Right to correct" desc="Request correction of inaccurate or incomplete data" />
            <RightsCard icon="🗑️" title="Right to delete" desc="Request deletion when there is no legitimate reason to retain data" />
            <RightsCard icon="📦" title="Right to portability" desc="Receive your data in a structured, machine-readable format" />
            <RightsCard icon="🚫" title="Right to object" desc="Object to processing of your data for marketing purposes" />
            <RightsCard icon="⏸️" title="Right to restrict" desc="Request restriction of processing in certain circumstances" />
            <RightsCard icon="↩️" title="Withdraw consent" desc="Withdraw consent for marketing at any time" />
            <RightsCard icon="📋" title="Right to be informed" desc="Know how and why your data is collected and used" />
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>To exercise any right, contact: <a href="mailto:contact@golivecompany.com" style={{ color: CY }}>contact@golivecompany.com</a> — we respond within 30 days.</div>
        </div>

        <Section title="1. Who We Are">
          <P>The GoLive Digital Solutions Company Ltd. is the <strong>data controller</strong> responsible for your personal information. We are incorporated in Nigeria (RC1644767) and operate as an authorized Microsoft Indirect Reseller (CSP Partner ID: 6787357) serving businesses across Africa.</P>
          <div style={{ background: GRAY, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: 16 }}>
            <P><strong>Data Protection Officer:</strong> Adeniyi Olayemi</P>
            <P><strong>Email:</strong> <a href="mailto:contact@golivecompany.com" style={{ color: CY }}>contact@golivecompany.com</a></P>
            <P><strong>Address:</strong> 7 Ibiyinka Olorunbe Close, Victoria Island, Lagos 106104, Nigeria</P>
            <P><strong>Regulatory authority:</strong> Nigeria Data Protection Commission (NDPC) — <a href="https://ndpb.gov.ng" target="_blank" rel="noopener noreferrer" style={{ color: CY }}>ndpb.gov.ng</a></P>
          </div>
        </Section>

        <Section title="2. Information We Collect">
          <Sub title="2.1 Information You Provide Directly">
            <UL items={[
              'Full name, job title and business email address',
              'Phone number and WhatsApp number',
              'Company name, industry and business address',
              'Domain name and current email provider',
              'Number of staff users and technical requirements',
              'Microsoft tenant domain and admin email (for existing M365 customers transferring to GoLive)',
              'Communications you send via email, WhatsApp or the website contact form',
            ]} />
          </Sub>
          <Sub title="2.2 Information Collected Automatically">
            <UL items={[
              'IP address and approximate location',
              'Browser type and operating system',
              'Pages visited on cloud.golivecompany.com and time spent',
              'Device type (desktop, mobile, tablet)',
            ]} />
          </Sub>
          <Sub title="2.3 Information from Microsoft (as your CSP)">
            <P>As your Microsoft CSP, GoLive has administrative access to certain tenant information:</P>
            <UL items={[
              'Tenant ID and domain name',
              'License count and subscription details',
              'Service health and usage reports (aggregate data only)',
              'Support ticket history',
            ]} />
            <InfoBox>GoLive does NOT access the content of your emails, files, Teams messages or other Microsoft 365 data unless you explicitly grant access for a specific support purpose.</InfoBox>
          </Sub>
        </Section>

        <Section title="3. How We Use Your Information">
          <Sub title="3.1 Service Delivery">
            <UL items={[
              'Setting up your Microsoft 365 tenant and user accounts',
              'Migrating your email, contacts and calendar data',
              'Configuring DNS, SPF, DKIM, DMARC and security settings',
              'Providing managed support and responding to requests',
              'Managing your Microsoft 365 licenses and renewals',
            ]} />
          </Sub>
          <Sub title="3.2 Communication">
            <UL items={[
              'Sending assessment confirmations and reference numbers',
              'Following up on migration and assessment requests',
              'Sending invoices and payment reminders',
              'Notifying you of Microsoft product updates relevant to your subscription',
              'Renewal reminders for Microsoft 365 licenses',
            ]} />
          </Sub>
          <Sub title="3.3 Marketing (with your consent only)">
            <P>With your explicit consent, we may send information about new GoLive services or Microsoft features. You may opt out at any time by emailing <a href="mailto:contact@golivecompany.com" style={{ color: CY }}>contact@golivecompany.com</a> or clicking unsubscribe in any marketing email.</P>
          </Sub>
        </Section>

        <Section title="4. Legal Basis for Processing (NDPA 2023)">
          <P>GoLive processes your personal data on the following lawful bases under the NDPA 2023:</P>
          <div style={{ background: GRAY, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${BORDER}` }}>
            {[
              ['Contract performance', 'Processing your data to set up your M365 account, perform migration, provide support'],
              ['Legal obligation', 'Tax records, NDPC compliance filings, financial reporting requirements'],
              ['Legitimate interests', 'Fraud prevention, security monitoring, renewal reminders, service improvement'],
              ['Consent', 'Marketing emails, newsletters and event invitations — always opt-in'],
            ].map(([basis, example], i) => (
              <div key={basis} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ padding: '12px 16px', background: i % 2 === 0 ? LIGHT : '#fff', fontWeight: 700, fontSize: 13, color: NAVY }}>{basis}</div>
                <div style={{ padding: '12px 16px', background: '#fff', fontSize: 13, color: '#333' }}>{example}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="5. How We Share Your Information">
          <InfoBox>GoLive does not sell your personal information. Ever.</InfoBox>
          <Sub title="5.1 Microsoft Corporation">
            <P>As your Microsoft CSP, GoLive shares necessary business information with Microsoft to provision and manage your Microsoft 365 licenses. Microsoft's privacy practices are at <a href="https://privacy.microsoft.com" target="_blank" rel="noopener noreferrer" style={{ color: CY }}>privacy.microsoft.com</a>.</P>
          </Sub>
          <Sub title="5.2 Service Providers">
            <P>GoLive uses trusted third-party providers for payment processing, email delivery, and cloud infrastructure. All providers are contractually required to maintain appropriate data protection standards and may only use your data to perform services on GoLive's behalf.</P>
          </Sub>
          <Sub title="5.3 Legal Requirements">
            <P>GoLive may disclose your information if required by law, court order, or at the request of the NDPC or other government authorities in Nigeria or applicable jurisdictions.</P>
          </Sub>
        </Section>

        <Section title="6. Data Retention">
          <div style={{ background: GRAY, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${BORDER}`, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: NAVY }}>
              <div style={{ padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 13 }}>Data Type</div>
              <div style={{ padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 13 }}>Retention Period</div>
            </div>
            {[
              ['Active customer records', 'Duration of service + 7 years'],
              ['Assessment / lead enquiries', '2 years from enquiry date'],
              ['Invoice and payment records', '7 years (Nigerian tax law)'],
              ['Support communications', '3 years after last interaction'],
              ['Website visitor logs', '90 days'],
              ['Marketing consent records', 'Until consent is withdrawn + 1 year'],
            ].map(([type, period], i) => (
              <div key={type} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: i % 2 === 0 ? LIGHT : '#fff', borderTop: `1px solid ${BORDER}` }}>
                <div style={{ padding: '10px 16px', fontSize: 13, color: '#333' }}>{type}</div>
                <div style={{ padding: '10px 16px', fontSize: 13, color: '#333', fontWeight: 500 }}>{period}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="7. Data Security">
          <P>GoLive implements the following measures to protect your personal data in accordance with NDPA requirements:</P>
          <UL items={[
            'Encrypted data transmission using HTTPS/TLS',
            'MongoDB database with authentication and role-based access controls',
            'Access controls limiting data to authorised GoLive staff only',
            'Regular security reviews and vulnerability assessments',
            'Staff training on data protection and security best practices',
            'Incident response procedures for data breaches',
          ]} />
          <InfoBox>In the event of a data breach that is likely to affect your rights and freedoms, GoLive will notify affected individuals and the NDPC within 72 hours of becoming aware of the breach, as required by the NDPA 2023.</InfoBox>
        </Section>

        <Section title="8. International Data Transfers">
          <P>As your Microsoft CSP, your Microsoft 365 data may be processed and stored in Microsoft data centres outside Nigeria. For Africa-based GoLive clients, data is typically stored in Microsoft's <strong>South Africa North</strong> or <strong>South Africa West</strong> data centres.</P>
          <P>GoLive ensures international data transfers comply with NDPA requirements through Microsoft's Data Processing Agreement and Standard Contractual Clauses, and Microsoft's certifications (ISO 27001, SOC 2 Type II).</P>
        </Section>

        <Section title="9. Cookies">
          <P>The GoLive Cloud Marketplace (cloud.golivecompany.com) uses only:</P>
          <UL items={[
            'Essential session cookies: Required for portal login and security — cannot be disabled',
            'Privacy-respecting analytics: To understand how visitors use our website and improve our services',
          ]} />
          <P>We do not use advertising cookies, third-party tracking cookies, or share browsing data with advertisers.</P>
        </Section>

        <Section title="10. Children's Privacy">
          <P>GoLive's services are intended for businesses only. We do not knowingly collect personal information from individuals under 18 years of age. If you believe a child has provided data to GoLive, please contact contact@golivecompany.com and we will delete such information immediately.</P>
        </Section>

        <Section title="11. Complaints">
          <P>If you are unhappy with how GoLive handles your personal information, you may lodge a complaint with:</P>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: GRAY, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 8 }}>GoLive (first instance)</div>
              <P>contact@golivecompany.com</P>
              <P>We aim to resolve all complaints within 14 days.</P>
            </div>
            <div style={{ background: GRAY, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Nigeria Data Protection Commission</div>
              <P><a href="https://ndpb.gov.ng" target="_blank" rel="noopener noreferrer" style={{ color: CY }}>ndpb.gov.ng</a></P>
              <P>Nigeria's primary data protection regulator under the NDPA 2023.</P>
            </div>
          </div>
        </Section>

        <Section title="12. Updates to This Policy">
          <P>GoLive may update this Privacy Policy to reflect changes in our practices, services or applicable law including NDPC guidance. Updated policies will be posted at cloud.golivecompany.com/privacy with a revised effective date. Active clients will be notified of material changes by email.</P>
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
              <a href="/privacy" style={{ color: TEAL, fontSize: 12, textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms" style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, textDecoration: 'none' }}>Terms of Service</a>
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
