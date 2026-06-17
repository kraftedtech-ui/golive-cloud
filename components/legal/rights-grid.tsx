import { Eye, Pencil, Trash2, Ban, Download, Hand, ShieldQuestion, Scale } from "lucide-react"

const rights = [
  { icon: Eye, title: "Right to Access", description: "Request a copy of the personal data we hold about you and confirmation of how it is processed." },
  { icon: Pencil, title: "Right to Rectification", description: "Ask us to correct inaccurate or incomplete personal information without undue delay." },
  { icon: Trash2, title: "Right to Erasure", description: "Request deletion of your personal data where there is no lawful reason for us to keep it." },
  { icon: Ban, title: "Right to Restrict", description: "Limit how we process your data while a query or objection about its use is resolved." },
  { icon: Download, title: "Right to Portability", description: "Receive your data in a structured, machine-readable format or have it transferred elsewhere." },
  { icon: Hand, title: "Right to Object", description: "Object to processing based on legitimate interests or to direct marketing at any time." },
  { icon: ShieldQuestion, title: "Right to Withdraw Consent", description: "Withdraw consent you previously gave, without affecting the lawfulness of prior processing." },
  { icon: Scale, title: "Right to Lodge a Complaint", description: "File a complaint with the Nigeria Data Protection Commission (NDPC) if your rights are breached." },
]

export function RightsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rights.map((right) => {
        const Icon = right.icon
        return (
          <div key={right.title} className="group rounded-xl border border-[#e3e9f0] bg-white p-5 transition-colors hover:border-[#0096c7]/50">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-[#e8f4fb] text-[#0096c7] transition-colors group-hover:bg-[#0096c7] group-hover:text-white">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-[#0d2233]">{right.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#5c7184]">{right.description}</p>
          </div>
        )
      })}
    </div>
  )
}
