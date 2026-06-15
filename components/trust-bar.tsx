import { Mail, Sparkles, ShieldCheck, Cloud, LayoutGrid } from "lucide-react"

const PILLARS = [
  { icon: Mail, label: "Microsoft 365" },
  { icon: Sparkles, label: "Copilot AI" },
  { icon: ShieldCheck, label: "Defender" },
  { icon: Cloud, label: "Azure" },
  { icon: LayoutGrid, label: "Power Platform" },
]

export function TrustBar() {
  return (
    <section id="pillars" className="border-b border-[#c8e6f0] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-9 text-center text-xs font-medium uppercase tracking-[0.16em] text-[#5a7a8a]">
          The complete Microsoft cloud stack, delivered locally
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PILLARS.map((p, i) => (
            <div key={p.label} className={`group flex flex-col items-center gap-3 rounded-xl border border-[#c8e6f0] bg-white px-4 py-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0096c7]/30 hover:shadow-md ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#e8f4fb] text-[#0096c7] ring-1 ring-inset ring-[#0096c7]/10 transition-colors duration-300 group-hover:bg-[#0096c7] group-hover:text-white">
                <p.icon className="size-5" />
              </span>
              <span className="text-sm font-medium tracking-tight text-[#0d2233]">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
