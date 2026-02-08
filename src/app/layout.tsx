import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Base2Stacks Bridge Tracker | Earn $B2S Tokens',
  description: 'Track cross-chain bridges between Base and Stacks. Earn $B2S tokens through daily rewards and staking. Built for Stacks Builder Rewards.',
  keywords: ['Stacks', 'Base', 'Bridge', 'Crypto', 'DeFi', 'B2S Token', 'Staking', 'Blockchain', 'Web3'],
  authors: [{ name: 'Willy Warrior', url: 'https://github.com/wkalidev' }],
  creator: 'Willy Warrior',
  publisher: 'Base2Stacks',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wkalidev-base2stacks-tracker.vercel.app',
    title: 'Base2Stacks Bridge Tracker | Earn $B2S Tokens',
    description: 'Track cross-chain bridges and earn rewards. Daily claims, staking, and more.',
    siteName: 'Base2Stacks Tracker',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Base2Stacks Logo',
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Base2Stacks Bridge Tracker',
    description: 'Track cross-chain bridges and earn $B2S tokens',
    creator: '@willycodexwar',
    images: ['/android-chrome-512x512.png'],
  },
  
  // Mobile
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  
  // Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  
  // Manifest
  manifest: '/site.webmanifest',
  
  // Theme
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://wkalidev-base2stacks-tracker.vercel.app" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}