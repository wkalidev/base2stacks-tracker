const APP_URL = 'https://base2stacks-tracker.vercel.app'

export function getReferralUrl(address: string): string {
  return `${APP_URL}?ref=${address.slice(0, 8)}`
}

export function getReferralShareText(address: string): string {
  const url = getReferralUrl(address)
  return `🌉 Join Base2Stacks Bridge Tracker!\n\nEarn $B2S tokens daily by tracking cross-chain bridges.\n\n👉 ${url}\n\n#B2S #Stacks #DeFi`
}

export function parseReferralCode(url: string): string | null {
  const params = new URLSearchParams(url.split('?')[1] || '')
  return params.get('ref')
}
