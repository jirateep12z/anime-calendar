import type { NextConfig } from 'next';

const next_config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self'; connect-src 'self' https://graphql.anilist.co https://s4.anilist.co"
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        pathname: '/file/anilistcdn/media/anime/cover/**'
      }
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [70, 75]
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    optimizePackageImports: ['lucide-react']
  },
  cacheComponents: true
};

export default next_config;
