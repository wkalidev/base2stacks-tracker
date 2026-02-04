import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Base2Stacks Bridge Tracker | $B2S',
  description: 'Track cross-chain bridges between Base Network and Stacks. Earn $B2S tokens for tracking transactions.',
  keywords: ['Base', 'Stacks', 'Bridge', 'Tracker', 'B2S', 'Web3', 'Cross-chain', 'DeFi', 'Crypto'],
  authors: [{ name: 'Willy Warrior', url: 'https://github.com/zcodebase' }],
  
  // PWA & Mobile
  manifest: '/site.webmanifest',
  themeColor: '#FF6B35',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  
  // Icons
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
      {
        rel: 'android-chrome',
        url: '/android-chrome-192x192.png',
      },
    ],
  },
  
  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    title: 'Base2Stacks Bridge Tracker',
    description: 'Track cross-chain activity between Base & Stacks. Earn $B2S tokens.',
    url: 'https://base2stacks-tracker.vercel.app',
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
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Base2Stacks Bridge Tracker',
    description: 'Track cross-chain bridges. Earn $B2S tokens. Built for Stacks Builder Rewards.',
    creator: '@willywarrior',
    images: ['/android-chrome-512x512.png'],
  },
  
  // Additional metadata
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
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-base-dark via-stacks-dark to-b2s-secondary">
          {children}
        </div>
      </body>
    </html>
  )
}