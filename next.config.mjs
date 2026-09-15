/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['isiweek.com', 'www.isiweek.com', '72.62.128.63'],
  // Deshabilitar indicador de desarrollo (la "N" en la esquina)
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '72.62.128.63',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.isiweek.com',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60,
  },
  async headers() {
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PHASE === 'phase-development-server' ||
      !process.env.NODE_ENV;

    const noCacheHeaders = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];

    const cacheHeaders = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ];

    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        source: '/_next/static/chunks/:path*.js',
        headers: noCacheHeaders,
      },
      {
        source: '/_next/static/css/:path*.css',
        headers: isDevelopment ? noCacheHeaders : cacheHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: isDevelopment ? noCacheHeaders : cacheHeaders,
      },
    ]
  },
}

// Bundle Analyzer (solo cuando ANALYZE=true)
// Nota: Para usar bundle analyzer, ejecutar: ANALYZE=true npm run build
export default nextConfig