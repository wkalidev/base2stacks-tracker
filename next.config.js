/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['base.org', 'stacks.org', 'api.stacks.co'],
  },
  env: {
    NEXT_PUBLIC_STACKS_NETWORK: process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet',
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_CONTRACT_NAME: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'b2s-token',
  },
}

module.exports = nextConfig
