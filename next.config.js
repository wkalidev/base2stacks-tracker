/** @type {import('next').NextConfig} */
const nextConfig = {
  // swcMinify is deprecated in Next.js 16 - removed
  images: {
    domains: ['placeholder.com'],
  },
}

module.exports = nextConfig