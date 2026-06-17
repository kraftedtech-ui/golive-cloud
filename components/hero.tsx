import { ShieldCheck, ArrowRight } from "lucide-react"
import { CtaLink } from "@/components/cta-link"
import { AssessmentForm } from "@/components/assessment-form"

const STATS = [
  { value: "8+", label: "African markets served" },
  { value: "48hr", label: "Typical migration window" },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden text-white" style={{ background: "linear-gradient(160deg, #0d2233 0%, #0a1a28 100%)" }}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[32rem] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, #0096c7 0%, transparent 65%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-32 size-[28rem] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #00c8c8 0%, transparent 65%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)" }} />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-28 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00c8c8]/30 bg-[#00c8c8]/10 px-3 py-1.5 text-xs font-medium tracking-wide text-[#00c8c8] backdrop-blur-sm">
            <ShieldCheck className="size-3.5 shrink-0" />
            Africa-authorized Microsoft CSP Partner
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08]">
            Enterprise Microsoft Cloud, delivered across <span className="text-[#00c8c8]">Africa</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base lg:text-lg">
            GoLive Digital Solutions is your authorized Microsoft Cloud Solution Provider. We license, deploy, secure and migrate your business to Microsoft 365, Copilot, Azure and Defender — with local billing, local support and enterprise-grade governance.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <CtaLink href="#assessment" className="w-full justify-center px-5 py-3 text-sm sm:w-auto sm:text-[15px]">
              Get free assessment <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
            </CtaLink>
            <CtaLink href="#packages" variant="outline" className="w-full justify-center px-5 py-3 text-sm sm:w-auto sm:text-[15px]">
              View packages
            </CtaLink>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-y-4 border-t border-white/10 pt-7 sm:max-w-xs sm:divide-x sm:divide-white/10 sm:gap-y-0">
            {STATS.map((stat, i) => (
              <div key={stat.label} className={`${i > 0 ? "sm:px-4" : "sm:pr-4"} flex flex-col items-center sm:items-start`}>
                <dt className="text-xl font-bold tracking-tight text-[#00c8c8] sm:text-2xl">{stat.value}</dt>
                <dd className="mt-1 text-[11px] leading-snug text-white/55 text-center sm:text-left sm:text-xs">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div id="assessment-hero" className="text-[#0d2233] lg:pl-4">
          <AssessmentForm variant="card" />
        </div>
      </div>
    </section>
  )
}
