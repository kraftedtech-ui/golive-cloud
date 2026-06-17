import { Navbar } from "@/components/legal/navbar"
import { TableOfContents } from "@/components/legal/table-of-contents"
import { PrivacyContent, privacySections } from "@/components/legal/privacy-content"
import { Footer } from "@/components/legal/footer"
import { ShieldCheck, CalendarDays, Building2 } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — The GoLive Digital Solutions Company Ltd.",
  description: "How The GoLive Digital Solutions Company Ltd. collects, uses and protects your personal data. NDPA 2023 & GAID 2025 compliant.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar currentPage="privacy" />
      <main>
        {/* Hero */}
        <section id="top" className="relative overflow-hidden bg-[#0d2233] text-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00c8c8]/40 bg-[#00c8c8]/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#00c8c8]">
                <ShieldCheck className="size-3.5" />Legal & Compliance
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
              <p className="mt-4 max-w-xl leading-relaxed text-white/70">
                This policy explains how The GoLive Digital Solutions Company Ltd. collects, uses, shares and safeguards your personal data when you use our services.
              </p>
              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="size-4 text-[#00c8c8]" />
                  <div><dt className="text-white/50">Effective date</dt><dd className="font-medium">17 June 2026</dd></div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Building2 className="size-4 text-[#00c8c8]" />
                  <div><dt className="text-white/50">Data controller</dt><dd className="font-medium">The GoLive Digital Solutions Company Ltd.</dd></div>
                </div>
              </dl>
            </div>
            <div className="flex items-center justify-center lg:justify-end">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur text-center">
                <img src="/images/ndpr-badge.png" alt="NDPR Compliance Badge" style={{ width: 144, height: 144, objectFit: 'contain' }} />
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/60">NDPA 2023 & GAID 2025 Compliant</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents sections={privacySections} />
              </div>
            </aside>
            <PrivacyContent />
          </div>
        </div>
      </main>
      <Footer currentPage="privacy" />
    </div>
  )
}
