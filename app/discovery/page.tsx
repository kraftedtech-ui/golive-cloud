import { Suspense } from "react"
import { PublicDiscoveryForm } from "@/components/public-discovery-form"
import { ShieldCheck, Sparkles, Clock } from "lucide-react"

export const metadata = {
  title: "Free Microsoft 365 Needs Assessment — GoLive",
  description: "Tell us about your business and get a tailored Microsoft 365 recommendation — takes about 5 minutes.",
}

const TRUST_POINTS = [
  { icon: Clock, text: "Takes about 5 minutes" },
  { icon: Sparkles, text: "Instant recommendation based on your answers" },
  { icon: ShieldCheck, text: "A specialist reviews every submission personally" },
]

export default function DiscoveryPage() {
  return (
    <main className="min-h-screen bg-[#f4fafd]">
      <div className="border-b border-[#c8e6f0] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0096c7]">
            <span className="h-px w-6 bg-[#0096c7]/40" />Free needs assessment<span className="h-px w-6 bg-[#0096c7]/40" />
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0d2233] sm:text-4xl">
            Tell us about your business.
            <span className="block">We'll tell you what fits</span>
          </h1>
          <p className="mt-4 leading-relaxed text-[#5a7a8a]">
            Whether you're already on Microsoft 365 or starting from scratch, answer a few questions and we'll point you to the right package —
            and flag anything that's worth a real conversation instead of guessing.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-xs font-medium text-[#5a7a8a]">
                <Icon className="size-4 text-[#00c8c8]" />{text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-[#c8e6f0] bg-white p-6 shadow-sm sm:p-8">
          <Suspense fallback={<p className="text-sm text-[#5a7a8a]">Loading…</p>}>
            <PublicDiscoveryForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-[#5a7a8a]">
          Prefer to talk it through? <a href="https://wa.me/2348083587801" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0096c7]">Message us on WhatsApp</a> instead.
        </p>
      </div>
    </main>
  )
}
