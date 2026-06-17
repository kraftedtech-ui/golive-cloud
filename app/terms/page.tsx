import { Navbar } from "@/components/legal/navbar"
import { TableOfContents } from "@/components/legal/table-of-contents"
import { TermsContent, termsSections } from "@/components/legal/terms-content"
import { Footer } from "@/components/legal/footer"
import { FileText, CalendarDays, Building2 } from "lucide-react"

export const metadata = {
  title: "Terms of Service — The GoLive Digital Solutions Company Ltd.",
  description: "Terms of Service for The GoLive Digital Solutions Company Ltd. Microsoft CSP cloud services. Governed by Nigerian law. RC1644767.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar currentPage="terms" />
      <main>
        {/* Hero */}
        <section id="top" className="relative overflow-hidden bg-[#0d2233] text-white">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#00c8c8]/40 bg-[#00c8c8]/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#00c8c8]">
                <FileText className="size-3.5" />Legal & Compliance
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
              <p className="mt-4 max-w-xl leading-relaxed text-white/70">
                These Terms govern your use of services provided by The GoLive Digital Solutions Company Ltd., including Microsoft 365 licensing, migration services and managed support across Africa.
              </p>
              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="size-4 text-[#00c8c8]" />
                  <div><dt className="text-white/50">Effective date</dt><dd className="font-medium">17 June 2026</dd></div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Building2 className="size-4 text-[#00c8c8]" />
                  <div><dt className="text-white/50">Company</dt><dd className="font-medium">The GoLive Digital Solutions Company Ltd.</dd></div>
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
                <TableOfContents sections={termsSections} />
              </div>
            </aside>
            <TermsContent />
          </div>
        </div>
      </main>
      <Footer currentPage="terms" />
    </div>
  )
}
