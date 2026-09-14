import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Per-build deployment id: appended to all asset URLs so browsers can
  // never assemble a stale app from year-long-cached chunks after a deploy.
  deploymentId: Date.now().toString(36),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cloud.golivecompany.com' },
    ],
  },
}

export default nextConfig
