import Link from "next/link"
import { ShieldCheck, BadgeCheck } from "lucide-react"

const COLUMNS = [
  { title: "Solutions", links: [{ label: "Microsoft 365", href: "#pillars" },{ label: "Copilot AI", href: "#pillars" },{ label: "Azure", href: "#pillars" },{ label: "Defender security", href: "#pillars" }] },
  { title: "Company", links: [{ label: "Packages", href: "#packages" },{ label: "Industry verticals", href: "#verticals" },{ label: "Target markets", href: "#markets" },{ label: "Get assessment", href: "#assessment" }] },
  { title: "Migrate", links: [{ label: "Switch CSP", href: "/migrate" },{ label: "Google Workspace", href: "/migrate" },{ label: "cPanel upgrade", href: "/migrate" },{ label: "48-hour switch", href: "/migrate" }] },
]

export function Footer() {
  return (
    <footer className="bg-[#0d2233] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <img 
                src="/images/logo-dark.png" 
                alt="GoLive Digital Solutions" 
                style={{ height: 140, width: 'auto', mixBlendMode: 'screen' }} 
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">Authorized Microsoft CSP partner delivering cloud, security and productivity across Africa.</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-white/60 transition-colors hover:text-[#00c8c8]">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8">
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80">
            <BadgeCheck className="size-4 text-[#00c8c8]" />Microsoft CSP Partner · ID 6787357
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80">
            <ShieldCheck className="size-4 text-[#00c8c8]" />NDPR Compliant · RC1644767
          </span>
          <img src="/images/ndpr-badge.png" alt="NDPR Compliance" className="h-9 w-auto" />
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The GoLive Digital Solutions Company Ltd. · RC1644767 · All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition-colors hover:text-white/80">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-white/80">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
