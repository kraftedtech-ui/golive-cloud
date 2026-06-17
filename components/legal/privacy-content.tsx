import { Mail, MapPin, Phone } from "lucide-react"
import { SectionHeading, InfoBox } from "./primitives"
import { RightsGrid } from "./rights-grid"

const legalBasisRows = [
  { activity: "Providing and maintaining our Microsoft 365 services", basis: "Performance of a contract" },
  { activity: "Processing payments and issuing invoices", basis: "Legal obligation" },
  { activity: "Sending marketing communications", basis: "Consent" },
  { activity: "Improving services and preventing fraud", basis: "Legitimate interests" },
  { activity: "Responding to legal or regulatory requests", basis: "Legal obligation" },
  { activity: "Microsoft CSP license provisioning", basis: "Performance of a contract" },
]

const retentionRows = [
  { category: "Active customer records", period: "Duration of service + 7 years", reason: "Service delivery and statutory financial obligations" },
  { category: "Assessment & lead enquiries", period: "2 years from enquiry date", reason: "Sales relationship management" },
  { category: "Invoice and payment records", period: "7 years", reason: "Nigerian tax law compliance" },
  { category: "Support communications", period: "3 years", reason: "Quality assurance and dispute resolution" },
  { category: "Marketing preferences", period: "Until consent withdrawn + 1 year", reason: "Consent-based processing" },
  { category: "Website visitor logs", period: "90 days", reason: "Security monitoring" },
]

export const privacySections = [
  { id: "introduction", title: "1. Who We Are" },
  { id: "information-we-collect", title: "2. Information We Collect" },
  { id: "how-we-use", title: "3. How We Use Your Data" },
  { id: "legal-basis", title: "4. Legal Basis for Processing" },
  { id: "data-sharing", title: "5. Data Sharing & Disclosure" },
  { id: "retention", title: "6. Data Retention" },
  { id: "your-rights", title: "7. Your Rights" },
  { id: "security", title: "8. Data Security" },
  { id: "international", title: "9. International Transfers" },
  { id: "cookies", title: "10. Cookies" },
  { id: "contact", title: "11. Contact Us" },
]

export function PrivacyContent() {
  return (
    <article className="max-w-none space-y-12">
      <section className="space-y-4">
        <SectionHeading id="introduction">1. Who We Are</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">
          The GoLive Digital Solutions Company Ltd. ("GoLive," "we," "us," or "our") is an authorized Microsoft Indirect Reseller incorporated in Nigeria (RC1644767) with registered office at 7 Ibiyinka Olorunbe Close, Victoria Island, Lagos 106104, Nigeria. We operate the GoLive Cloud Marketplace at cloud.golivecompany.com and serve businesses across Africa with Microsoft 365, Azure, Copilot and Defender solutions.
        </p>
        <p className="leading-relaxed text-[#0d2233]/80">
          We are the data controller responsible for your personal information under the Nigeria Data Protection Act (NDPA) 2023 and the General Application and Implementation Directive (GAID) effective September 2025.
        </p>
        <InfoBox title="Scope of this policy">
          This policy applies to all personal data processed by The GoLive Digital Solutions Company Ltd. across our website, client portal, assessment forms, migration requests and related services. It does not cover third-party websites we may link to, including Microsoft's own services.
        </InfoBox>
      </section>

      <section className="space-y-4">
        <SectionHeading id="information-we-collect">2. Information We Collect</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">We collect information you provide directly, data generated through your use of our services, and information from Microsoft as your CSP.</p>
        <ul className="space-y-2 text-[#0d2233]/80">
          {[
            ["Identity & contact data", "Full name, business email address, phone number and WhatsApp number."],
            ["Business data", "Company name, industry, domain name, number of users and current email provider."],
            ["Microsoft tenant data", "Tenant ID, domain, license count and subscription details (as your CSP)."],
            ["Transaction data", "Services purchased, invoices, payment metadata and renewal dates."],
            ["Technical data", "IP address, device type, browser and usage analytics from cloud.golivecompany.com."],
          ].map(([label, desc]) => (
            <li key={label as string} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00c8c8]" />
              <span className="leading-relaxed"><strong className="font-semibold text-[#0d2233]">{label}:</strong> {desc}</span>
            </li>
          ))}
        </ul>
        <InfoBox title="Microsoft data access">
          As your Microsoft CSP, GoLive has administrative access to your tenant. We do NOT access the content of your emails, files, Teams messages or other Microsoft 365 data unless you explicitly grant access for a specific support purpose.
        </InfoBox>
      </section>

      <section className="space-y-4">
        <SectionHeading id="how-we-use">3. How We Use Your Data</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">We use your personal data to deliver and improve our Microsoft cloud services, communicate with you, process payments, and meet legal obligations. We never sell your personal data to third parties.</p>
        <ul className="space-y-2 text-[#0d2233]/80">
          {["Setting up and managing your Microsoft 365 tenant and licenses","Processing assessment and migration requests","Sending invoices, renewal reminders and support communications","Configuring security settings (MFA, SPF, DKIM, DMARC, Defender)","Responding to support requests within our SLA","Notifying you of Microsoft product updates relevant to your subscription","Sending marketing communications where you have opted in"].map(item => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00c8c8]" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <InfoBox title="Marketing communications">
          We only send marketing messages where you have opted in. You can withdraw consent at any time by emailing contact@golivecompany.com or using the unsubscribe link in any marketing email.
        </InfoBox>
      </section>

      <section className="space-y-4">
        <SectionHeading id="legal-basis">4. Legal Basis for Processing</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">We process personal data only where we have a valid legal basis under the NDPA 2023.</p>
        <div className="overflow-x-auto rounded-lg border border-[#e3e9f0]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#0d2233] text-white">
                <th className="px-4 py-3 font-semibold">Processing activity</th>
                <th className="px-4 py-3 font-semibold">Legal basis</th>
              </tr>
            </thead>
            <tbody>
              {legalBasisRows.map((row, i) => (
                <tr key={row.activity} className={i % 2 ? "bg-[#f4f7fb]" : "bg-white"}>
                  <td className="border-t border-[#e3e9f0] px-4 py-3 text-[#0d2233]/80">{row.activity}</td>
                  <td className="border-t border-[#e3e9f0] px-4 py-3">
                    <span className="inline-flex rounded-full bg-[#e8f4fb] px-2.5 py-0.5 text-xs font-medium text-[#0096c7]">{row.basis}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading id="data-sharing">5. Data Sharing & Disclosure</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">GoLive does not sell your personal information. We may share your information with:</p>
        <ul className="space-y-2 text-[#0d2233]/80">
          {[
            ["Microsoft Corporation", "As your CSP, we share necessary business information to provision and manage your Microsoft 365 licenses. Microsoft's privacy practices are at privacy.microsoft.com."],
            ["Authorized distributors", "Ingram Micro, Crayon or Westcon as our Microsoft Indirect Provider for license ordering. They process data under their own data protection agreements."],
            ["Payment processors", "For invoice and subscription management, bound by appropriate data protection standards."],
            ["Legal authorities", "Where required by Nigerian law, court order or government request."],
          ].map(([label, desc]) => (
            <li key={label as string} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00c8c8]" />
              <span className="leading-relaxed"><strong className="font-semibold text-[#0d2233]">{label}:</strong> {desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <SectionHeading id="retention">6. Data Retention</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">We retain personal data only for as long as necessary to fulfil the purposes for which it was collected, including legal, tax and accounting requirements under Nigerian law.</p>
        <div className="overflow-x-auto rounded-lg border border-[#e3e9f0]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#0d2233] text-white">
                <th className="px-4 py-3 font-semibold">Data category</th>
                <th className="px-4 py-3 font-semibold">Retention period</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody>
              {retentionRows.map((row, i) => (
                <tr key={row.category} className={i % 2 ? "bg-[#f4f7fb]" : "bg-white"}>
                  <td className="border-t border-[#e3e9f0] px-4 py-3 font-medium text-[#0d2233]">{row.category}</td>
                  <td className="border-t border-[#e3e9f0] px-4 py-3 text-[#0d2233]/80">{row.period}</td>
                  <td className="border-t border-[#e3e9f0] px-4 py-3 text-[#5c7184]">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading id="your-rights">7. Your Rights</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">Under the NDPA 2023 and GAID 2025, you have the following rights regarding your personal data. To exercise any right, contact us at contact@golivecompany.com. We respond within 30 days.</p>
        <RightsGrid />
      </section>

      <section className="space-y-4">
        <SectionHeading id="security">8. Data Security</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">We implement appropriate technical and organizational measures to protect your data, including:</p>
        <ul className="space-y-2 text-[#0d2233]/80">
          {["Encrypted data transmission using HTTPS/TLS","MongoDB database with authentication and role-based access controls","Access controls limiting data to authorized GoLive staff only","Regular security reviews and vulnerability assessments","Staff training on data protection and security","Incident response procedures for data breaches"].map(item => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00c8c8]" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <InfoBox title="Breach notification">
          In the event of a personal data breach likely to affect your rights and freedoms, we will notify affected individuals and the Nigeria Data Protection Commission (NDPC) within 72 hours, as required by the NDPA 2023.
        </InfoBox>
      </section>

      <section className="space-y-4">
        <SectionHeading id="international">9. International Transfers</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">
          As your Microsoft CSP, your Microsoft 365 data may be processed and stored in Microsoft data centres outside Nigeria. For Africa-based GoLive clients, data is typically stored in Microsoft's South Africa North or South Africa West data centres.
        </p>
        <p className="leading-relaxed text-[#0d2233]/80">
          We ensure international data transfers comply with NDPA 2023 requirements through Microsoft's Data Processing Agreement, Standard Contractual Clauses, and Microsoft's certifications including ISO 27001 and SOC 2 Type II.
        </p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="cookies">10. Cookies</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">The GoLive Cloud Marketplace uses only essential session cookies required for portal login and security, and privacy-respecting analytics to understand how visitors use our website. We do not use advertising cookies, third-party tracking cookies, or share browsing data with advertisers.</p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="contact">11. Contact Us</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">For questions about this Privacy Policy or to exercise your rights, contact our Data Protection Officer:</p>
        <div className="rounded-xl border border-[#e3e9f0] bg-[#f4f7fb] p-6">
          <p className="text-sm font-semibold text-[#0d2233]">Data Protection Officer</p>
          <p className="text-sm text-[#5c7184]">The GoLive Digital Solutions Company Ltd. · RC1644767</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-[#0096c7]" />
              <div className="text-sm">
                <dt className="text-[#5c7184]">Email</dt>
                <dd className="font-medium text-[#0d2233]">contact@golivecompany.com</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-[#0096c7]" />
              <div className="text-sm">
                <dt className="text-[#5c7184]">WhatsApp / Phone</dt>
                <dd className="font-medium text-[#0d2233]">+234 808 358 7801</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#0096c7]" />
              <div className="text-sm">
                <dt className="text-[#5c7184]">Address</dt>
                <dd className="font-medium text-[#0d2233]">7 Ibiyinka Olorunbe Close, Victoria Island, Lagos 106104, Nigeria</dd>
              </div>
            </div>
          </dl>
          <div className="mt-4 rounded-lg bg-[#e8f4fb] p-3 text-xs text-[#0096c7]">
            Regulatory authority: Nigeria Data Protection Commission (NDPC) — <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="underline">ndpc.gov.ng</a>
          </div>
        </div>
      </section>
    </article>
  )
}
