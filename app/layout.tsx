import type { Metadata } from 'next'
import './globals.css'
import SessionWrapper from './SessionWrapper'

export const metadata: Metadata = {
  title: 'GoLive Cloud Marketplace — Microsoft 365, Copilot, Azure & Defender for African Businesses',
  description: 'GoLive Digital Solutions is an Africa-authorized Microsoft Cloud Solution Provider. Get Microsoft 365, Copilot AI, Azure, Defender security, and Power Platform with setup, migration, training and monthly support.',
  keywords: ['Microsoft 365 Africa','Microsoft CSP Nigeria','Microsoft 365 Nigeria','Azure Africa','Microsoft Copilot Africa','GoLive Digital Solutions','Microsoft cloud Africa','Office 365 Nigeria'],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}
