import { Mail, MapPin, Phone } from "lucide-react"
import { SectionHeading, InfoBox } from "./primitives"

export const termsSections = [
  { id: "definitions", title: "1. Definitions" },
  { id: "services", title: "2. Services Provided" },
  { id: "obligations", title: "3. Client Obligations" },
  { id: "fees", title: "4. Fees and Payment" },
  { id: "microsoft", title: "5. Microsoft Licensing" },
  { id: "data", title: "6. Data & Privacy" },
  { id: "ip", title: "7. Intellectual Property" },
  { id: "warranties", title: "8. Warranties & Disclaimers" },
  { id: "liability", title: "9. Limitation of Liability" },
  { id: "termination", title: "10. Termination" },
  { id: "disputes", title: "11. Dispute Resolution" },
  { id: "general", title: "12. General Provisions" },
  { id: "contact", title: "13. Contact" },
]

export function TermsContent() {
  return (
    <article className="max-w-none space-y-12">
      <section className="space-y-4">
        <InfoBox title="About these Terms">
          These Terms of Service govern your use of GoLive Digital Solutions cloud services, including Microsoft 365 licensing, migration services, managed support, and the GoLive Cloud Marketplace at cloud.golivecompany.com. By engaging GoLive services or submitting an assessment request, you agree to these Terms. These Terms comply with the Nigeria Data Protection Act (NDPA) 2023 and the General Application and Implementation Directive (GAID) 2025.
        </InfoBox>
      </section>

      <section className="space-y-4">
        <SectionHeading id="definitions">1. Definitions</SectionHeading>
        <ul className="space-y-3 text-[#0d2233]/80">
          {[
            ['"GoLive" or "Company"', 'means The GoLive Digital Solutions Company Ltd., incorporated in Nigeria (RC1644767), with registered office at 7 Ibiyinka Olorunbe Close, Victoria Island, Lagos 106104, Nigeria. Authorized Microsoft Indirect Reseller, CSP Partner ID: 6787357.'],
            ['"Client" or "You"', 'means the business, organisation or individual engaging GoLive for cloud services.'],
            ['"Services"', 'means all Microsoft 365 licensing, email migration, security configuration, training, managed support, and any other cloud services provided by GoLive.'],
            ['"Microsoft Products"', 'means software, subscriptions and services provided by Microsoft Corporation and resold by GoLive as an authorized Microsoft Indirect Reseller.'],
            ['"Platform"', 'means the GoLive Cloud Marketplace available at cloud.golivecompany.com.'],
            ['"NDPA"', 'means the Nigeria Data Protection Act 2023 and the General Application and Implementation Directive (GAID) issued by the Nigeria Data Protection Commission (NDPC).'],
          ].map(([term, def]) => (
            <li key={term as string} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00c8c8]" />
              <span className="leading-relaxed"><strong className="font-semibold text-[#0d2233]">{term}</strong> {def}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <SectionHeading id="services">2. Services Provided</SectionHeading>
        {[
          ["2.1 Microsoft 365 Licensing", "GoLive resells Microsoft 365 subscriptions as an authorized Microsoft Indirect Reseller (Partner ID: 6787357). Microsoft 365 licenses are subject to Microsoft's own terms at microsoft.com/licensing. GoLive acts as your CSP and is responsible for billing, support and license management on your behalf."],
          ["2.2 Migration Services", "GoLive provides email migration, domain configuration, DNS setup, and data transfer services from existing providers (cPanel, Google Workspace, Zoho and others) to Microsoft 365. GoLive maintains backups of all client data prior to migration commencement."],
          ["2.3 Security Configuration", "GoLive configures Microsoft 365 security settings including MFA, SPF, DKIM, DMARC, anti-phishing policies and Microsoft Defender for Business as included in your agreed package, following Microsoft best practice recommendations."],
          ["2.4 Managed Support", "Monthly managed support is provided in accordance with the GoLive Service Level Agreement (SLA) applicable to your package tier. GoLive reserves the right to update support terms with 30 days written notice."],
          ["2.5 Training", "GoLive provides Microsoft 365 user and admin training as part of the onboarding package. Additional training sessions beyond initial onboarding are available at GoLive's standard daily rate."],
        ].map(([title, content]) => (
          <div key={title as string}>
            <h3 className="mb-2 text-sm font-semibold text-[#0096c7]">{title}</h3>
            <p className="leading-relaxed text-[#0d2233]/80">{content}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <SectionHeading id="obligations">3. Client Obligations</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">By engaging GoLive services, you agree to:</p>
        <ul className="space-y-2 text-[#0d2233]/80">
          {["Provide accurate and complete information when submitting assessment forms or service requests","Designate a primary IT contact available during migration and setup activities","Provide access to existing email systems, DNS records and domain registrar accounts as required","Ensure all users complete MFA enrollment within 14 days of account setup","Not share Microsoft 365 admin credentials with unauthorised parties","Promptly notify GoLive of any suspected security incidents or unauthorised access","Pay invoices within the agreed payment terms","Comply with Microsoft's acceptable use policies and terms of service","Not use Microsoft 365 services for any unlawful purpose"].map(item => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00c8c8]" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <SectionHeading id="fees">4. Fees and Payment</SectionHeading>
        {[
          ["4.1 Pricing", "GoLive fees are set out in the agreed proposal. Prices are quoted in USD and may be invoiced in local currency (NGN, GHS, KES, ZAR) at the prevailing exchange rate. GoLive reserves the right to adjust pricing with 30 days written notice."],
          ["4.2 Microsoft License Fees", "Microsoft 365 subscription fees are billed monthly or annually as agreed. Annual subscriptions are billed upfront. Microsoft may adjust license pricing and such changes will be passed on to the Client."],
          ["4.3 Setup Fees", "One-time setup and migration fees are due prior to commencement of migration. Setup fees are non-refundable once migration work has commenced."],
          ["4.4 Payment Terms", "Invoices are due within 14 days of issue. Late payment may result in suspension of services. GoLive reserves the right to charge interest on overdue amounts at 2% per month."],
          ["4.5 Taxes", "All fees are exclusive of applicable taxes including VAT or withholding tax. The Client is responsible for all applicable taxes in their jurisdiction."],
        ].map(([title, content]) => (
          <div key={title as string}>
            <h3 className="mb-2 text-sm font-semibold text-[#0096c7]">{title}</h3>
            <p className="leading-relaxed text-[#0d2233]/80">{content}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <SectionHeading id="microsoft">5. Microsoft Licensing Terms</SectionHeading>
        <InfoBox title="Microsoft Customer Agreement">
          Microsoft 365 subscriptions are governed by Microsoft's Customer Agreement and Product Terms, which take precedence over these Terms with respect to the Microsoft products. A copy is available at microsoft.com/licensing/docs/customeragreement.
        </InfoBox>
        <ul className="space-y-2 text-[#0d2233]/80">
          {["GoLive is acting as a Microsoft Indirect Reseller and not as an agent of Microsoft Corporation","Microsoft Corporation is not a party to this Agreement and has no liability to the Client under these Terms","Certain Microsoft features may be unavailable in specific African markets","Microsoft may modify, discontinue or alter products and services with notice"].map(item => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00c8c8]" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <SectionHeading id="data">6. Data & Privacy (NDPA Compliance)</SectionHeading>
        <InfoBox title="NDPA 2023 & GAID 2025">
          The GoLive Digital Solutions Company Ltd. operates in full compliance with the Nigeria Data Protection Act (NDPA) 2023 and the General Application and Implementation Directive (GAID) effective September 2025.
        </InfoBox>
        <p className="leading-relaxed text-[#0d2233]/80">GoLive processes Client personal data strictly for the purpose of delivering agreed services. GoLive does not sell, share or disclose Client data to third parties except as required to deliver services or as required by Nigerian law. For full details see our <a href="/privacy" className="text-[#0096c7] underline">Privacy Policy</a>.</p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="ip">7. Intellectual Property</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">All materials, documentation, training content and processes developed by GoLive remain the intellectual property of The GoLive Digital Solutions Company Ltd. Clients are granted a non-exclusive, non-transferable licence to use GoLive-provided documentation for their internal business purposes only.</p>
        <p className="leading-relaxed text-[#0d2233]/80">Microsoft 365, Teams, OneDrive, SharePoint, Azure, Defender, Copilot and all related Microsoft brand names are trademarks of Microsoft Corporation. GoLive's use of these marks is as an authorized reseller only.</p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="warranties">8. Warranties & Disclaimers</SectionHeading>
        <h3 className="text-sm font-semibold text-[#0096c7]">8.1 GoLive Warranties</h3>
        <p className="leading-relaxed text-[#0d2233]/80">GoLive warrants that services will be performed with reasonable skill and care, and that GoLive holds valid Microsoft Partner Center credentials as an authorized Indirect Reseller.</p>
        <h3 className="text-sm font-semibold text-[#0096c7]">8.2 Disclaimers</h3>
        <p className="leading-relaxed text-[#0d2233]/80">GoLive does not warrant that Microsoft 365 services will be available without interruption (Microsoft provides their own uptime SLA), that security measures will prevent all cyber threats, or that migration will be completed within a specific timeframe if the Client fails to provide required access or information.</p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="liability">9. Limitation of Liability</SectionHeading>
        <ul className="space-y-2 text-[#0d2233]/80">
          {["GoLive's total liability shall not exceed the total fees paid by the Client in the three months preceding the claim","GoLive shall not be liable for indirect, consequential, special or punitive damages including loss of profits or loss of data","GoLive shall not be liable for Microsoft service outages, internet disruptions, force majeure events or acts of government"].map(item => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00c8c8]" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <SectionHeading id="termination">10. Termination</SectionHeading>
        {[
          ["10.1 Termination by Client", "The Client may terminate monthly subscriptions with 30 days written notice to contact@golivecompany.com. Annual subscriptions may be cancelled but are not refundable for the remaining subscription period."],
          ["10.2 Termination by GoLive", "GoLive may terminate services with 30 days written notice, or immediately if the Client fails to pay invoices after 30 days, breaches Microsoft's acceptable use policy, or engages in fraudulent or unlawful activity."],
          ["10.3 CSP Transfer on Termination", "GoLive will provide reasonable assistance with CSP transfer to another provider for 30 days following termination notice. Your Microsoft 365 data and licenses are not lost upon termination."],
        ].map(([title, content]) => (
          <div key={title as string}>
            <h3 className="mb-2 text-sm font-semibold text-[#0096c7]">{title}</h3>
            <p className="leading-relaxed text-[#0d2233]/80">{content}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <SectionHeading id="disputes">11. Dispute Resolution</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">The parties agree to attempt to resolve any dispute informally by contacting GoLive at contact@golivecompany.com. If not resolved within 30 days, either party may refer the matter to mediation or arbitration under the rules of the Lagos Court of Arbitration. These Terms are governed by the laws of the Federal Republic of Nigeria. The parties submit to the exclusive jurisdiction of the courts of Lagos State.</p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="general">12. General Provisions</SectionHeading>
        {[
          ["12.1 Entire Agreement", "These Terms, together with any signed proposal or service order, constitute the entire agreement between the parties."],
          ["12.2 Amendments", "GoLive may update these Terms from time to time. Updated Terms will be posted at cloud.golivecompany.com/terms. Continued use constitutes acceptance."],
          ["12.3 Severability", "If any provision is found invalid or unenforceable, the remaining provisions continue in full force."],
          ["12.4 Assignment", "The Client may not assign rights without GoLive's prior written consent. GoLive may assign to a successor entity in connection with a merger or acquisition."],
        ].map(([title, content]) => (
          <div key={title as string}>
            <h3 className="mb-2 text-sm font-semibold text-[#0096c7]">{title}</h3>
            <p className="leading-relaxed text-[#0d2233]/80">{content}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <SectionHeading id="contact">13. Contact</SectionHeading>
        <p className="leading-relaxed text-[#0d2233]/80">For questions about these Terms of Service:</p>
        <div className="rounded-xl border border-[#e3e9f0] bg-[#f4f7fb] p-6">
          <p className="text-sm font-semibold text-[#0d2233]">The GoLive Digital Solutions Company Ltd.</p>
          <p className="text-sm text-[#5c7184]">RC1644767 · Microsoft CSP Partner ID: 6787357</p>
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
          <p className="mt-3 text-xs text-[#5c7184]">Effective date: 17 June 2026 · Version 1.0</p>
        </div>
      </section>
    </article>
  )
}
