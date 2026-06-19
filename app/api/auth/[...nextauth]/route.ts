import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'

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

            // Enforce 2FA if enabled — defense in depth, even though the login page
            // already gates this before calling signIn.
            if (user.twoFactorEnabled) {
              if (!credentials.totpCode) return null
              const isCodeValid = authenticator.verify({
                token: credentials.totpCode.trim(),
                secret: user.twoFactorSecret || '',
              })
              if (!isCodeValid) return null
            }

            await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
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
