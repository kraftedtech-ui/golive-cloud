import Link from "next/link"

type Variant = "primary" | "navy" | "outline"

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[#0096c7] text-white shadow-sm hover:bg-[#0096c7]/90",
  navy: "bg-[#0d2233] text-white shadow-sm hover:bg-[#0a1a28]",
  outline: "border border-white/25 bg-white/5 text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/10",
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export function CtaLink({
  href,
  children,
  variant = "primary",
  className,
  onClick,
}: {
  href: string
  children: React.ReactNode
  variant?: Variant
  className?: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group/cta inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0096c7]/50 focus-visible:ring-offset-2",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </Link>
  )
}
