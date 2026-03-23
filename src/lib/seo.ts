export const SEO = {
  title:       'Base2Stacks Bridge Tracker | $B2S',
  description: 'Track cross-chain bridges between Base Network and Stacks. Earn $B2S tokens.',
  keywords:    ['Base', 'Stacks', 'Bridge', 'B2S', 'DeFi', 'Web3'],
  image:       '/android-chrome-512x512.png',
  url:         'https://base2stacks-tracker.vercel.app',
  twitter:     '@willycodexwar',
}

export function getPageTitle(page: string): string {
  return `${page} | ${SEO.title}`
}

export function getOGTags(title: string, description: string) {
  return { title, description, image: SEO.image, url: SEO.url }
}
