"use client"
import { useState } from "react"
import { Menu, X, LogIn } from "lucide-react"
import { Logo } from "./logo"

export function Navbar({ currentPage }: { currentPage: 'terms' | 'privacy' }) {
  const [open, setOpen] = useState(false)
  const navLinks = [
    { label: "Home", href: "/" },
    { label: currentPage === 'terms' ? "Privacy Policy" : "Terms of Service", href: currentPage === 'terms' ? '/privacy' : '/terms' },
  ]
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d2233]/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="/" className="shrink-0"><Logo /></a>
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              {link.label}
            </a>
          ))}
          <a href="/portal/login"
            className="ml-2 inline-flex items-center gap-2 rounded-md bg-[#0096c7] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00c8c8]">
            <LogIn className="size-4" />Portal Login
          </a>
        </div>
        <button type="button" onClick={() => setOpen(v => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-white/10 bg-[#0d2233] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
                {link.label}
              </a>
            ))}
            <a href="/portal/login"
              className="mt-1 inline-flex items-center gap-2 rounded-md bg-[#0096c7] px-4 py-2 text-sm font-semibold text-white">
              <LogIn className="size-4" />Portal Login
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
