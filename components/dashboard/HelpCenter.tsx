"use client"
import { useMemo, useState } from "react"
import { BookOpen, ClipboardList, X } from "lucide-react"
import { HELP_SECTIONS, guidesFor, sopsFor, type HelpGuide } from "@/lib/helpGuides"

const ROLES = [["admin", "Administrator"], ["operations", "Operations"], ["sales", "Sales"], ["support", "Support"], ["viewer", "Viewer"]] as const
const btn = "inline-flex h-8 items-center gap-1.5 rounded-[4px] border px-3 text-sm font-semibold"

/**
 * The portal Help area: the officer's own SOP and the how-to guides for their
 * role. The Administrator can preview what any role sees.
 */
export default function HelpCenter({ role }: { role: string }) {
  const [asRole, setAsRole] = useState(role)
  const [tab, setTab] = useState<"guides" | "sop">("guides")
  const guides = useMemo(() => guidesFor(asRole), [asRole])
  const sops = useMemo(() => sopsFor(asRole), [asRole])
  const [openId, setOpenId] = useState<string>(guides[0]?.id || "")
  const [zoom, setZoom] = useState<string | null>(null)
  const guide: HelpGuide | undefined = guides.find((g) => g.id === openId) || guides[0]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#e0e0e0] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#242424]">Help and how-to</h2>
            <p className="mt-1 max-w-[80ch] text-sm text-[#616161]">Step-by-step guides for the screens you use, and your standard operating procedure. Start with Getting started if you are new.</p>
          </div>
          {role === "admin" && (
            <label className="text-xs font-semibold text-[#424242]">View as
              <select className="ml-2 h-8 rounded-[4px] border border-[#d1d1d1] bg-white px-2 text-sm font-normal" value={asRole}
                onChange={(e) => { setAsRole(e.target.value); setOpenId(guidesFor(e.target.value)[0]?.id || "") }}>
                {ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          )}
        </div>
        <div className="mt-4 flex gap-2" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "guides"} onClick={() => setTab("guides")}
            className={`${btn} ${tab === "guides" ? "border-[#0b7e9b] bg-[#e8f7fb] text-[#0b7e9b]" : "border-[#d1d1d1] bg-white text-[#242424]"}`}><BookOpen className="size-4" /> How-to guides</button>
          <button type="button" role="tab" aria-selected={tab === "sop"} onClick={() => setTab("sop")}
            className={`${btn} ${tab === "sop" ? "border-[#0b7e9b] bg-[#e8f7fb] text-[#0b7e9b]" : "border-[#d1d1d1] bg-white text-[#242424]"}`}><ClipboardList className="size-4" /> My SOP</button>
        </div>
      </div>

      {tab === "guides" && (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <nav className="h-fit rounded-lg border border-[#e0e0e0] bg-white p-3" aria-label="Guides">
            {HELP_SECTIONS.map((sec) => {
              const list = guides.filter((g) => g.section === sec)
              if (!list.length) return null
              return (
                <div key={sec} className="mb-3 last:mb-0">
                  <p className="px-2 pb-1 text-xs font-semibold text-[#616161]">{sec}</p>
                  {list.map((g) => (
                    <button key={g.id} type="button" onClick={() => setOpenId(g.id)} aria-current={guide?.id === g.id ? "page" : undefined}
                      className={`block w-full rounded-[4px] px-2 py-1.5 text-left text-sm ${guide?.id === g.id ? "bg-[#f0f0f0] font-semibold text-[#242424]" : "text-[#424242] hover:bg-[#f5f5f5]"}`}>{g.title}</button>
                  ))}
                </div>
              )
            })}
          </nav>
          {guide && (
            <article className="rounded-lg border border-[#e0e0e0] bg-white p-5">
              <p className="text-xs font-semibold text-[#0b7e9b]">{guide.section}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#242424]">{guide.title}</h3>
              <p className="mt-1 text-sm text-[#616161]">{guide.summary}</p>
              <ol className="mt-4 space-y-5">
                {guide.steps.map((s, i) => (
                  <li key={i} className="grid gap-3" style={{ gridTemplateColumns: s.title || s.body ? "32px minmax(0,1fr)" : "32px minmax(0,1fr)" }}>
                    <span className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold ${s.title || s.body ? "bg-[#00a5a8] text-white" : ""}`}>{s.title || s.body ? guide.steps.slice(0, i + 1).filter((x) => x.title || x.body).length : ""}</span>
                    <div>
                      {s.title && <p className="font-semibold text-[#242424]">{s.title}</p>}
                      {s.body && <p className="mt-0.5 text-sm leading-6 text-[#424242]">{s.body}</p>}
                      {s.image && (
                        <figure className="mt-2">
                          <button type="button" onClick={() => setZoom(s.image!)} className="block w-full overflow-hidden rounded-[6px] border border-[#e0e0e0] text-left" title="Click to enlarge">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.image} alt={s.caption || s.title || guide.title} loading="lazy" className="block w-full" />
                          </button>
                          {s.caption && <figcaption className="mt-1 text-xs text-[#616161]">{s.caption}</figcaption>}
                        </figure>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-xs text-[#616161]">Numbers in the pictures match the numbers in the text. Screenshots use sample data.</p>
            </article>
          )}
        </div>
      )}

      {tab === "sop" && sops.map((s) => (
        <section key={s.title} className="rounded-lg border border-[#e0e0e0] bg-white p-5">
          <h3 className="text-lg font-semibold text-[#242424]">SOP: {s.title}</h3>
          <p className="mt-1 text-sm text-[#424242]"><strong>Purpose.</strong> {s.purpose}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {([["Daily", s.daily], ["Weekly", s.weekly], ["Monthly", s.monthly]] as const).filter(([, l]) => l.length).map(([h, l]) => (
              <div key={h} className="rounded-[6px] border border-[#e0e0e0] p-3">
                <p className="mb-1.5 text-sm font-semibold text-[#0b7e9b]">{h}</p>
                <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-[#242424]">{l.map((x, i) => <li key={i}>{x}</li>)}</ol>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[6px] border border-red-200 bg-red-50 p-3">
            <p className="mb-1.5 text-sm font-semibold text-[#c50f1f]">You must never</p>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-[#242424]">{s.never.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        </section>
      ))}

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" onClick={() => setZoom(null)}>
          <button type="button" aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white p-2"><X className="size-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-[6px] bg-white" />
        </div>
      )}
    </div>
  )
}
