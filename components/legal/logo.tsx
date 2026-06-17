export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center ${className ?? ""}`}>
      <img src="/images/logo-dark.png" alt="The GoLive Digital Solutions Company Ltd." style={{ height: 56, width: 'auto' }} />
    </span>
  )
}
