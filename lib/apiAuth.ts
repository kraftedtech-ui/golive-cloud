import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export interface SessionUser {
  email?: string | null
  name?: string | null
  role?: string
  id?: string
}

/** Returns the session user, or null if not logged in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session.user as SessionUser
}

/**
 * Use at the top of a route handler. Returns a 401 NextResponse to return
 * immediately if there's no session, or the SessionUser if there is one.
 *
 * Usage:
 *   const auth = await requireSession()
 *   if (auth instanceof NextResponse) return auth
 *   // auth is now SessionUser
 */
export async function requireSession(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  return user
}

/** Same as requireSession but also requires role === 'admin'. */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const result = await requireSession()
  if (result instanceof NextResponse) return result
  if (result.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  return result
}
