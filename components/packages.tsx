"use client"

import { Check, Star } from "lucide-react"
import { CtaLink } from "@/components/cta-link"
import { useCurrency } from "@/components/currency-context"
import type { PublicPackage } from "@/lib/publicProductData"

const TAGLINES: Record<string, string> = {
  starter: "Professional email & productivity to get online fast.",
  secure: "Productivity plus advanced security & device management.",
  ai: "Copilot and tailored security at scale.",
}

function PriceDisplay({ pkg }: { pkg: PublicPackage }) {
  const { format } = useCurrency()
  if (pkg.priceUsd === null) return <span className="text-4xl font-bold text-[#0d2233]">Custom</span>
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-4xl font-bold text-[#0d2233]">{format(pkg.priceUsd)}</span>
      <span className="text-sm text-[#5a7a8a]">/user/month</span>
    </span>
  )
}

export function Packages({ packages }: { packages: PublicPackage[] }) {
  return (
    <section id="packages" className="relative bg-[#f4fafd]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8e6f0] to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0096c7]">
            <span className="h-px w-6 bg-[#0096c7]/40" />Packages<span className="h-px w-6 bg-[#0096c7]/40" />
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0d2233] sm:text-4xl">Simple, transparent licensing</h2>
          <p className="mt-4 leading-relaxed text-[#5a7a8a]">Per-user pricing billed in your local currency. Switch the currency selector to see pricing for your market.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
          {packages.map((pkg) => (
            <div key={pkg.key} className={pkg.featured
              ? "relative rounded-2xl bg-white p-8 shadow-lg ring-2 ring-[#0096c7] lg:-mt-5 lg:mb-5"
              : "relative rounded-2xl border border-[#c8e6f0] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"}>
              {pkg.featured && (
                <>
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#0096c7] via-[#00c8c8] to-[#0096c7]" />
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#0096c7] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm">
                    <Star className="size-3 fill-current" />Most popular
                  </span>
                </>
              )}
              <h3 className="text-lg font-bold tracking-tight text-[#0d2233]">{pkg.name}</h3>
              <p className="mt-1.5 min-h-10 text-sm leading-relaxed text-[#5a7a8a]">{TAGLINES[pkg.key] || ""}</p>
              <div className="mt-6"><PriceDisplay pkg={pkg} /></div>
              <CtaLink href="#assessment" variant={pkg.featured ? "primary" : "navy"} className="mt-6 w-full">
                {pkg.priceUsd === null ? "Talk to sales" : "Get started"}
              </CtaLink>
              <ul className="mt-8 space-y-3.5 border-t border-[#c8e6f0] pt-7">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[#0d2233]">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#00c8c8]/10">
                      <Check className="size-3.5 text-[#00c8c8]" />
                    </span>
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
