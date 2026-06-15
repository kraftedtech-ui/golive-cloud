import Link from "next/link"
import { RefreshCw, Mailbox, Server, ArrowRight } from "lucide-react"

const MIGRATIONS = [
  { icon: RefreshCw, badge: "CSP transfer", title: "Switch CSP", desc: "Already on Microsoft 365? Move your tenant to GoLive for local billing, better support and zero downtime." },
  { icon: Mailbox, badge: "Email migration", title: "Google Workspace migration", desc: "Migrate mailboxes, calendars, contacts and Drive files from Google Workspace to Microsoft 365." },
  { icon: Server, badge: "Upgrade", title: "cPanel upgrade", desc: "Move legacy cPanel and webmail to a secure, modern Microsoft 365 environment without losing data." },
]

export function Migration() {
  return (
    <section id="migrate" className="relative bg-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0096c7]">
            <span className="h-px w-6 bg-[#0096c7]/40" />Migration<span className="h-px w-6 bg-[#0096c7]/40" />
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0d2233] sm:text-4xl">Switch to GoLive in 48 hours</h2>
          <p className="mt-4 leading-relaxed text-[#5a7a8a]">White-glove migrations handled by certified engineers — your team keeps working while we move everything across.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {MIGRATIONS.map((m) => (
            <div key={m.title} className="group flex flex-col rounded-2xl border border-[#c8e6f0] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <span className="flex size-12 items-center justify-center rounded-xl text-[#00c8c8]" style={{ background: "linear-gradient(150deg, #0d2233 0%, #0a1a28 100%)" }}>
                <m.icon className="size-6" />
              </span>
              <span className="mt-5 inline-flex w-fit rounded-full bg-[#e8f4fb] px-2.5 py-1 text-xs font-medium tracking-wide text-[#0096c7]">{m.badge}</span>
              <h3 className="mt-3 text-lg font-bold tracking-tight text-[#0d2233]">{m.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5a7a8a]">{m.desc}</p>
              <Link href="/migrate" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0096c7] transition-colors hover:text-[#0d2233]">
                Start migration<ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
