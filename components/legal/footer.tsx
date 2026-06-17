export function Footer({ currentPage }: { currentPage: 'terms' | 'privacy' }) {
  return (
    <footer className="bg-[#0d2233] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <img src="/images/logo-dark.png" alt="GoLive" style={{ height: 60, width: 'auto', mixBlendMode: 'screen' }} />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              The GoLive Digital Solutions Company Ltd. builds and operates secure Microsoft cloud solutions for businesses across Africa.
            </p>
          </div>
          <div className="flex items-start gap-10">
            <nav aria-label="Legal" className="text-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Legal</p>
              <ul className="space-y-2">
                <li>
                  <a href="/terms" className={`transition-colors hover:text-[#00c8c8] ${currentPage === 'terms' ? 'text-[#00c8c8] font-medium' : 'text-white/70'}`}>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className={`transition-colors hover:text-[#00c8c8] ${currentPage === 'privacy' ? 'text-[#00c8c8] font-medium' : 'text-white/70'}`}>
                    Privacy Policy
                  </a>
                </li>
                <li><a href="/" className="text-white/70 transition-colors hover:text-[#00c8c8]">Home</a></li>
              </ul>
            </nav>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <img src="/images/ndpr-badge.png" alt="NDPR Compliance" style={{ width: 72, height: 72, objectFit: 'contain' }} />
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The GoLive Digital Solutions Company Ltd. · RC1644767 · All rights reserved.</p>
          <p>NDPA 2023 & GAID 2025 Compliant · Registered in Nigeria</p>
        </div>
      </div>
    </footer>
  )
}
