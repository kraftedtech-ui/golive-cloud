const MARKETS = [
  { country: "Nigeria", code: "NG", currency: "NGN" },
  { country: "Ghana", code: "GH", currency: "GHS" },
  { country: "Kenya", code: "KE", currency: "KES" },
  { country: "South Africa", code: "ZA", currency: "ZAR" },
  { country: "Tanzania", code: "TZ", currency: "TZS" },
  { country: "Uganda", code: "UG", currency: "UGX" },
  { country: "Rwanda", code: "RW", currency: "RWF" },
  { country: "Egypt", code: "EG", currency: "EGP" },
]

export function Markets() {
  return (
    <section id="markets" className="relative bg-[#f4fafd]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8e6f0] to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0096c7]">
            <span className="h-px w-6 bg-[#0096c7]/40" />Target markets<span className="h-px w-6 bg-[#0096c7]/40" />
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0d2233] sm:text-4xl">Serving businesses across Africa</h2>
          <p className="mt-4 leading-relaxed text-[#5a7a8a]">Local billing and support in the currencies and markets your business operates in.</p>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {MARKETS.map((m) => (
            <div key={m.country} className="group flex items-center gap-2.5 rounded-xl border border-[#c8e6f0] bg-white px-3 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0096c7]/30 hover:shadow-md sm:gap-3.5 sm:px-5 sm:py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold tracking-tight text-[#00c8c8] ring-1 ring-inset ring-white/10 sm:size-10 sm:text-sm" style={{ background: "linear-gradient(150deg, #0d2233 0%, #0a1a28 100%)" }}>
                {m.code}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold tracking-tight text-[#0d2233]">{m.country}</span>
                <span className="text-xs text-[#5a7a8a]">{m.currency}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
