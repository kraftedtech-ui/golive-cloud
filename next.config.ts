import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cloud.golivecompany.com' },
    ],
  },
}

export default nextConfig
