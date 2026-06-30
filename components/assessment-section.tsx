import { CheckCircle2 } from "lucide-react"
import { AssessmentForm } from "@/components/assessment-form"

const BENEFITS = [
  "Free, no-obligation Microsoft licensing review",
  "Right-sized package recommendation for your team",
  "Security & compliance gap analysis",
  "Local-currency pricing and migration plan",
]

export function AssessmentSection() {
  return (
    <section id="assessment" className="relative overflow-hidden text-white" style={{ background: "linear-gradient(160deg, #0d2233 0%, #0a1a28 100%)" }}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 size-[30rem] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #0096c7 0%, transparent 65%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 70% 80% at 30% 50%, black 30%, transparent 100%)" }} />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#00c8c8]">
            <span className="h-px w-6 bg-[#00c8c8]/50" />Free assessment
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Get your free Microsoft cloud assessment</h2>
          <p className="mt-4 max-w-lg leading-relaxed text-white/70">Tell us about your business and a GoLive specialist will prepare a tailored Microsoft 365, Copilot, Azure and Defender plan — priced in your local currency.</p>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#00c8c8]" />
                <span className="text-sm text-white/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-[#0d2233]">
          <AssessmentForm variant="section" />
          <p className="mt-4 text-center text-xs text-white/60 lg:text-left">
            Already know your setup well? <a href="/discovery" className="font-semibold text-[#00c8c8] hover:underline">Take the full needs assessment →</a>
          </p>
        </div>
      </div>
    </section>
  )
}
