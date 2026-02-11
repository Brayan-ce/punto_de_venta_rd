/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚛️ React
  reactStrictMode: true,

  // 🚀 Next 16 + Turbopack
  turbopack: {},

  // 🖼️ Configuración de imágenes
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

  // 🌐 Headers
  async headers() {
    // Detectar modo desarrollo de forma más robusta
    const isDevelopment = 
      process.env.NODE_ENV === 'development' || 
      process.env.NEXT_PHASE === 'phase-development-server' ||
      !process.env.NODE_ENV; // Si no está definido, asumir desarrollo
    
    const noCacheHeaders = [
      { 
        key: 'Cache-Control', 
        value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' 
      },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];
    
    const cacheHeaders = [
      { 
        key: 'Cache-Control', 
        value: 'public, max-age=31536000, immutable' 
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
      // NO cachear chunks JS de Next.js (incluye Server Actions)
      {
        source: '/_next/static/chunks/:path*.js',
        headers: noCacheHeaders,
      },
      // NO cachear CSS modules en desarrollo (para hot reload)
      // IMPORTANTE: Esta regla debe ir ANTES de la regla general /_next/static/:path*
      {
        source: '/_next/static/css/:path*.css',
        headers: isDevelopment ? noCacheHeaders : cacheHeaders,
      },
      // Cachear otros assets estáticos normalmente (solo en producción)
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
