"use client"
import { useEffect, useState } from "react"

export function TableOfContents({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id || '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5c7184]">On this page</p>
      <ul className="space-y-1 border-l border-[#e3e9f0]">
        {sections.map((s) => {
          const isActive = active === s.id
          return (
            <li key={s.id}>
              <a href={`#${s.id}`}
                className={`-ml-px block border-l-2 py-1.5 pl-4 leading-snug transition-colors ${
                  isActive ? "border-[#0096c7] font-medium text-[#0096c7]" : "border-transparent text-[#5c7184] hover:border-[#e3e9f0] hover:text-[#0d2233]"
                }`}>
                {s.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
