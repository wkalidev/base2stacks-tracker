/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compression
  compress: true,
  
  // Static optimization
  swcMinify: true,
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig