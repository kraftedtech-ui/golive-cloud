import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionWrapper from './SessionWrapper'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GoLive Digital Solutions — Microsoft Cloud for African Businesses',
  description:
    'Authorized Microsoft CSP partner in Africa. Microsoft 365, Copilot, Azure & Defender licensing, deployment and migration for businesses across Africa. Partner ID 6787357.',
  keywords: ['Microsoft 365 Africa', 'Microsoft CSP Nigeria', 'Microsoft 365 Nigeria', 'Azure Africa', 'Microsoft Copilot Africa', 'GoLive Digital Solutions', 'Microsoft cloud Africa'],
  openGraph: {
    title: 'GoLive Cloud Marketplace',
    description: 'Microsoft 365, Copilot, Azure & Defender for African Businesses',
    url: 'https://cloud.golivecompany.com',
    siteName: 'GoLive Cloud Marketplace',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoLive Cloud Marketplace',
    description: 'Microsoft 365, Copilot, Azure & Defender for African Businesses',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0d2233',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} bg-white`}>
      <body className="antialiased" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}
