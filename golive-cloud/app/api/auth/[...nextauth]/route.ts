import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'GoLive Portal',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        if (!adminEmail || !adminPassword) return null
        if (credentials.email !== adminEmail) return null
        const isValid =
          credentials.password === adminPassword ||
          (adminPassword.startsWith('$2') &&
            (await bcrypt.compare(credentials.password, adminPassword)))
        if (!isValid) return null
        return { id: '1', email: adminEmail, name: 'GoLive Admin' }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/portal/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = 'admin'
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
