import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { SUPPORT_DENIED_API, SUPPORT_READ_ONLY } from '@/lib/roles'

/**
 * /portal pages: unchanged. Signed-out visitors are sent to /portal/login.
 * /api routes: a signed-out request passes through to the route, which does
 * its own checks (many API routes are public: applications, partner links,
 * the WHMCS hook). A signed-in user with a restricted role is refused the
 * API areas that role may not reach. Admin, operations and sales pass here
 * and are checked action by action inside the routes (see lib/roles.ts).
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    if (!pathname.startsWith('/api/')) return NextResponse.next()
    const role = (req.nextauth.token as { role?: string } | null)?.role
    if (role === 'support') {
      const denied = SUPPORT_DENIED_API.some((p) => pathname === p || pathname.startsWith(p + '/'))
      const readOnly = SUPPORT_READ_ONLY.some((p) => pathname === p || pathname.startsWith(p + '/')) && req.method !== 'GET'
      if (denied || readOnly) {
        return NextResponse.json({ success: false, error: 'Your role does not have access to this area.' }, { status: 403 })
      }
    }
    return NextResponse.next()
  },
  {
    pages: { signIn: '/portal/login' },
    callbacks: {
      // API routes authorise themselves; only /portal pages require a session here.
      authorized: ({ token, req }) => req.nextUrl.pathname.startsWith('/api/') || !!token,
    },
  }
)

export const config = {
  matcher: ['/portal/:path*', '/api/:path*'],
}
