import type { ReactNode } from "react"

export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 border-b-2 border-[#0096c7] pb-2 text-xl font-semibold tracking-tight text-[#0d2233] sm:text-2xl">
      {children}
    </h2>
  )
}

export function InfoBox({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-r-lg border-l-4 border-[#0096c7] bg-[#e8f4fb] p-4 sm:p-5">
      {title && <p className="mb-1 text-sm font-semibold text-[#0d2233]">{title}</p>}
      <div className="text-sm leading-relaxed text-[#0d2233]/80">{children}</div>
    </div>
  )
}
