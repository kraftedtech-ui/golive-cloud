import { Scale, GraduationCap, Church, Stethoscope, Workflow } from "lucide-react"

const VERTICALS = [
  { icon: Scale, title: "Legal", desc: "Secure document management, confidential client communication and compliance-ready archiving for law firms." },
  { icon: GraduationCap, title: "Schools", desc: "Microsoft 365 Education, Teams classrooms and managed devices for students and staff." },
  { icon: Church, title: "Churches", desc: "Affordable email, member communication and collaboration tools for ministries and NGOs." },
  { icon: Stethoscope, title: "Clinics", desc: "Protected health data, secure scheduling and HIPAA-aligned collaboration for healthcare providers." },
  { icon: Workflow, title: "Business Automation", desc: "Power Platform, Copilot and workflow automation to streamline operations end to end." },
]

export function Verticals() {
  return (
    <section id="verticals" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0096c7]">
            <span className="h-px w-6 bg-[#0096c7]/40" />Industry verticals<span className="h-px w-6 bg-[#0096c7]/40" />
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0d2233] sm:text-4xl">Built for how your industry works</h2>
          <p className="mt-4 leading-relaxed text-[#5a7a8a]">Tailored Microsoft cloud solutions for the sectors driving African business.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VERTICALS.map((v) => (
            <div key={v.title} className="group rounded-2xl border border-[#c8e6f0] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#0096c7]/30 hover:shadow-md">
              <span className="flex size-12 items-center justify-center rounded-xl bg-[#e8f4fb] text-[#0096c7] ring-1 ring-inset ring-[#0096c7]/10 transition-colors duration-300 group-hover:bg-[#0096c7] group-hover:text-white">
                <v.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold tracking-tight text-[#0d2233]">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5a7a8a]">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
