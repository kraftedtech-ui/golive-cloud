import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/portal/login',
  },
})

export const config = {
  matcher: ['/portal/:path*'],
}
