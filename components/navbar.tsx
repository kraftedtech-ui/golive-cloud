"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, Menu, X } from "lucide-react"
import { CtaLink } from "@/components/cta-link"
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/components/currency-context"

const NAV_LINKS = [
  { label: "Pillars", href: "#pillars" },
  { label: "Packages", href: "#packages" },
  { label: "Verticals", href: "#verticals" },
  { label: "Migrate", href: "/migrate" },
]

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "us", NGN: "ng", GHS: "gh", KES: "ke", ZAR: "za"
}

function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-md border border-[#c8e6f0] bg-white px-3 py-2 text-sm font-medium text-[#0d2233] outline-none transition-colors hover:border-[#0096c7]"
      >
        <img
          src={`https://flagcdn.com/w20/${CURRENCY_FLAGS[currency]}.png`}
          width={16} height={12} alt={currency}
          className="rounded-sm object-cover"
          style={{ width: 16, height: 12 }}
        />
        <span>{currency}</span>
        <ChevronDown className="size-3.5 text-[#5a7a8a]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[#c8e6f0] bg-white shadow-lg">
          {Object.values(CURRENCIES).map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => { setCurrency(c.code as CurrencyCode); setOpen(false) }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[#f4f7fb] ${currency === c.code ? 'text-[#0096c7] font-semibold' : 'text-[#0d2233]'}`}
            >
              <img
                src={`https://flagcdn.com/w20/${CURRENCY_FLAGS[c.code]}.png`}
                width={16} height={12} alt={c.code}
                className="rounded-sm object-cover"
                style={{ width: 16, height: 12 }}
              />
              <span>{c.code}</span>
              <span className="ml-auto text-xs text-[#5a7a8a]">{c.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled ? "border-[#c8e6f0] bg-white/85 shadow-sm backdrop-blur-xl" : "border-transparent bg-white/70 backdrop-blur-md"}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <img 
            src="/images/logo-dark.png" 
            alt="GoLive Digital Solutions" 
            style={{ height: 52, width: 'auto', mixBlendMode: 'screen' }} 
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3.5 py-2 text-sm font-medium tracking-tight text-[#5a7a8a] transition-colors hover:bg-[#e8f4fb] hover:text-[#0d2233]">{link.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <CurrencySelector />
          <Link href="/portal/login" className="text-sm font-medium text-[#5a7a8a] hover:text-[#0d2233]">Portal login</Link>
          <CtaLink href="#assessment">Get free assessment</CtaLink>
        </div>

        <div className="flex items-center md:hidden">
          <button type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-md border border-[#c8e6f0] text-[#0d2233] transition-colors hover:bg-[#e8f4fb]">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#c8e6f0] bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-[#0d2233] hover:bg-[#e8f4fb]">{link.label}</Link>
            ))}
            <Link href="/portal/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-[#5a7a8a] hover:bg-[#e8f4fb]">Portal login</Link>
            <div className="mt-3 border-t border-[#c8e6f0] pt-3">
              <p className="mb-2 px-3 text-xs font-medium text-[#5a7a8a]">Currency</p>
              <div className="px-3"><CurrencySelector /></div>
            </div>
            <CtaLink href="#assessment" onClick={() => setOpen(false)} className="mt-3 w-full">Get free assessment</CtaLink>
          </nav>
        </div>
      )}
    </header>
  )
}
