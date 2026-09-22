import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import SessionWrapper from './SessionWrapper'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
// Portal typeface. Applied only inside [data-theme='portal'] (see globals.css),
// so the public pages keep their current type until they are redesigned.
// latin-ext carries the Naira sign.
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GoLive Digital Solutions | Microsoft Cloud for African Businesses',
  description: 'Authorized Microsoft CSP partner in Africa. Microsoft 365, Copilot, Azure & Defender licensing, deployment and migration for businesses across Africa. Partner ID 6787357.',
  keywords: ['Microsoft 365 Africa', 'Microsoft CSP Nigeria', 'Microsoft 365 Nigeria', 'Azure Africa', 'Microsoft Copilot Africa', 'GoLive Digital Solutions'],
  openGraph: {
    title: 'GoLive Cloud Marketplace',
    description: 'Microsoft 365, Copilot, Azure & Defender for African Businesses',
    url: 'https://cloud.golivecompany.com',
    siteName: 'GoLive Cloud Marketplace',
    locale: 'en_NG',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0d2233',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} bg-white`}>
      <body className="antialiased" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}
