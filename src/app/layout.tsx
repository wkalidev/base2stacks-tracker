import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AgentChat from '@/components/AgentChat';

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FF6B35',
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://base2stacks-tracker.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Base2Stacks Bridge Tracker | $B2S',
  description: 'Track cross-chain bridges between Base Network and Stacks. Earn $B2S tokens for tracking transactions.',
  keywords: ['Base', 'Stacks', 'Bridge', 'Tracker', 'B2S', 'Web3', 'Cross-chain', 'DeFi', 'Crypto'],
  authors: [{ name: 'wkalidev', url: 'https://github.com/wkalidev' }],

  manifest: '/site.webmanifest',

  other: {
    'talentapp:project_verification': 'c4153b278dcd0cd530ec2934c29011c1991e8f3784316efaf662ff9e1c365cc18ccbb1886e27d103e58ab690c502083a404cc4eea5de422cc1923080a55fe9c4',
    'base:app_id': '69ad336936e1b05c113ad6f0',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png' },
    ],
  },

  openGraph: {
    title: 'Base2Stacks Bridge Tracker',
    description: 'Track cross-chain activity between Base & Stacks. Earn $B2S tokens.',
    url: BASE_URL,
    siteName: 'Base2Stacks Tracker',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Base2Stacks Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Base2Stacks Bridge Tracker',
    description: 'Track cross-chain bridges. Earn $B2S tokens. Built for Stacks Builder Rewards.',
    creator: '@willycodexwar',
    images: ['/android-chrome-512x512.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-base-dark via-stacks-dark to-b2s-secondary">
          {children}
        </div>
        <AgentChat />
      </body>
    </html>
  )
}