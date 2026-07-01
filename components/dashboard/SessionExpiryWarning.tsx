'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'

const WARN_BEFORE_MS = 5 * 60 * 1000  // show warning 5 minutes before expiry
const TICK_INTERVAL_MS = 10_000        // check every 10 seconds — cheap, not a constant re-render

function formatCountdown(ms: number) {
  const totalSecs = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

export default function SessionExpiryWarning() {
  const { data: session, update } = useSession()
  const [msRemaining, setMsRemaining] = useState<number | null>(null)
  const [extending, setExtending] = useState(false)
  const [extended, setExtended] = useState(false)

  const computeRemaining = useCallback(() => {
    if (!session?.expires) return null
    return new Date(session.expires).getTime() - Date.now()
  }, [session?.expires])

  useEffect(() => {
    const tick = () => setMsRemaining(computeRemaining())
    tick() // run immediately
    const id = setInterval(tick, TICK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [computeRemaining])

  // Auto-sign-out the moment the session actually expires — don't leave a
  // broken authenticated shell open past the expiry boundary.
  useEffect(() => {
    if (msRemaining !== null && msRemaining <= 0) {
      signOut({ callbackUrl: '/portal/login' })
    }
  }, [msRemaining])

  async function extendSession() {
    setExtending(true)
    try {
      // Calling update() triggers the jwt callback with trigger='update',
      // which bumps iat and causes NextAuth to re-issue a fresh 2-hour JWT.
      await update()
      setExtended(true)
      setTimeout(() => setExtended(false), 3000)
    } catch {
      // If the update fails (network blip etc.), just let the countdown run.
    } finally {
      setExtending(false)
    }
  }

  // Only render when inside the warning window and the session hasn't already expired
  const inWarningWindow = msRemaining !== null && msRemaining > 0 && msRemaining <= WARN_BEFORE_MS
  if (!inWarningWindow) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-full max-w-md -translate-x-1/2 px-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            ⏱ Session expires in {formatCountdown(msRemaining)}
          </p>
          <p className="text-xs text-amber-700">
            {extended ? '✓ Session extended for 2 hours.' : 'You will be signed out automatically. Click Extend to stay logged in.'}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={extendSession}
            disabled={extending || extended}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {extending ? 'Extending…' : extended ? 'Extended!' : 'Extend'}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/portal/login' })}
            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
