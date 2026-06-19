import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { verify } from 'otplib'

const TOTP_MAX_ATTEMPTS = 5
const TOTP_LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'GoLive Portal',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          await connectDB()
          const user = await User.findOne({ email: credentials.email.toLowerCase(), active: true })
          if (user) {
            const isValid = await bcrypt.compare(credentials.password, user.password)
            if (!isValid) return null

            if (user.twoFactorEnabled) {
              // Check lockout first
              if (user.totpLockedUntil && user.totpLockedUntil > new Date()) {
                return null
              }

              if (!credentials.totpCode) return null

              const result = await verify({
                token: credentials.totpCode.trim(),
                secret: user.twoFactorSecret || '',
              })

              if (!result.valid) {
                user.failedTotpAttempts = (user.failedTotpAttempts || 0) + 1
                if (user.failedTotpAttempts >= TOTP_MAX_ATTEMPTS) {
                  user.totpLockedUntil = new Date(Date.now() + TOTP_LOCKOUT_MS)
                  user.failedTotpAttempts = 0
                }
                await user.save()
                return null
              }

              // Success — reset failure tracking
              if (user.failedTotpAttempts > 0 || user.totpLockedUntil) {
                user.failedTotpAttempts = 0
                user.totpLockedUntil = undefined
              }
            }

            user.lastLogin = new Date()
            await user.save()
            return { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
          }
        } catch (err) {
          console.error('MongoDB auth error:', err)
        }

        // Break-glass env-based admin account — exempt from 2FA by design.
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        if (!adminEmail || !adminPassword) return null
        if (credentials.email !== adminEmail) return null
        const isValid = credentials.password === adminPassword
        if (!isValid) return null
        return { id: 'admin', email: adminEmail, name: 'GoLive Admin', role: 'admin' }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/portal/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = (user as { role?: string }).role || 'sales'; token.id = user.id }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string
        ;(session.user as { role?: string; id?: string }).id = token.id as string
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
