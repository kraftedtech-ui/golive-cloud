"use client"

import { Check, Star } from "lucide-react"
import { CtaLink } from "@/components/cta-link"
import { useCurrency } from "@/components/currency-context"
import type { PublicPackage } from "@/lib/publicProductData"

const TAGLINES: Record<string, string> = {
  starter: "Professional email & productivity to get online fast.",
  standard: "Full desktop Office apps with business email and Teams.",
  secure: "Productivity plus advanced security & device management.",
  ai: "Copilot and tailored security at scale.",
}

/**
 * The first feature line is always the underlying Microsoft licence. Promote
 * it to a subtitle so the customer can see exactly which Microsoft product
 * they are buying, rather than inferring it from a GoLive package name.
 */
function licenceOf(pkg: PublicPackage): string | null {
  const first = pkg.features[0]
  return first && first.startsWith("Microsoft") ? first : null
}

/**
 * Shows what each way of committing actually costs. Quoting only the annual
 * rate under a "/user/month" label understates monthly billing by ~20%.
 */
function PriceDisplay({ pkg }: { pkg: PublicPackage }) {
  const { format } = useCurrency()

  if (pkg.priceUsd === null) {
    return (
      <div className="min-h-[104px]">
        <span className="text-4xl font-bold text-[#0d2233]">Custom</span>
        <p className="mt-1 text-xs font-medium text-[#0096c7]">Priced to your Copilot readiness</p>
      </div>
    )
  }

  return (
    <div className="min-h-[104px]">
      <span className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-[#0d2233]">{format(pkg.priceUsd)}</span>
        <span className="text-sm text-[#5a7a8a]">/user/month</span>
      </span>
      <p className="mt-1 text-xs font-medium text-[#0096c7]">on annual commitment, billed upfront</p>

      {pkg.monthlyCommitUsd !== null && (
        <p className="mt-2.5 text-xs leading-relaxed text-[#5a7a8a]">
          or <span className="font-semibold text-[#0d2233]">{format(pkg.monthlyCommitUsd)}</span>/user/month
          {" "}on monthly commitment — cancel anytime
          {pkg.annualBilledMonthlyUsd !== null && (
            <>
              <br />
              <span className="font-semibold text-[#0d2233]">{format(pkg.annualBilledMonthlyUsd)}</span>/user/month
              {" "}annual commitment, billed monthly
            </>
          )}
        </p>
      )}
    </div>
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
          <p className="mt-4 leading-relaxed text-[#5a7a8a]">
            Every price below, for every way of committing — because the same Microsoft licence costs about 20% more
            month to month than on an annual term. Switch the currency selector to see pricing for your market.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5 lg:items-start">
          {packages.map((pkg) => {
            const licence = licenceOf(pkg)
            const features = licence ? pkg.features.slice(1) : pkg.features
            return (
              <div key={pkg.key} className={pkg.featured
                ? "relative rounded-2xl bg-white p-8 shadow-lg ring-2 ring-[#0096c7] lg:p-6 lg:-mt-5 lg:mb-5"
                : "relative rounded-2xl border border-[#c8e6f0] bg-white p-8 shadow-sm transition-all duration-300 lg:p-6 hover:-translate-y-1 hover:shadow-md"}>
                {pkg.featured && (
                  <>
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#0096c7] via-[#00c8c8] to-[#0096c7]" />
                    <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#0096c7] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm">
                      <Star className="size-3 fill-current" />Most popular
                    </span>
                  </>
                )}

                <h3 className="text-lg font-bold tracking-tight text-[#0d2233]">{pkg.name}</h3>
                {licence && (
                  <p className="mt-1.5 text-xs font-semibold leading-snug text-[#0096c7]">Includes {licence}</p>
                )}
                <p className="mt-1.5 min-h-10 text-sm leading-relaxed text-[#5a7a8a]">{TAGLINES[pkg.key] || ""}</p>

                <div className="mt-6"><PriceDisplay pkg={pkg} /></div>

                <CtaLink href="#assessment" variant={pkg.featured ? "primary" : "navy"} className="mt-6 w-full">
                  {pkg.priceUsd === null ? "Talk to sales" : "Get started"}
                </CtaLink>

                <ul className="mt-8 space-y-3.5 border-t border-[#c8e6f0] pt-7">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[#0d2233]">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#00c8c8]/10">
                        <Check className="size-3.5 text-[#00c8c8]" />
                      </span>
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-[#5a7a8a]">
          Prices shown are Microsoft list prices per user per month, exclusive of VAT, converted at today&apos;s rate.
          Annual commitment fixes your seat count for twelve months; seats may be added at any time but not reduced
          until renewal. Setup, migration and support are GoLive services quoted separately.
          The GoLive Digital Solutions Company Ltd is an authorised Microsoft Cloud Solution Provider indirect reseller.
          Microsoft, Microsoft 365, Copilot, Azure and Defender are trademarks of the Microsoft group of companies.
        </p>
      </div>
    </section>
  )
}
