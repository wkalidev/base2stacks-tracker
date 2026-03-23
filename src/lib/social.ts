const APP_URL = 'https://base2stacks-tracker.vercel.app'

export function getTwitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}

export function getFarcasterShareUrl(text: string): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
}

export function getClaimShareText(amount = 5): string {
  return `🎁 Just claimed ${amount} $B2S on Base2Stacks!\n🌉 Track cross-chain bridges & earn daily.\n👉 ${APP_URL}\n#B2S #Stacks #DeFi`
}

export function getStakeShareText(amount: number): string {
  return `💰 Just staked ${amount} $B2S!\n📈 Earning up to 37.5% APY.\n👉 ${APP_URL}\n#B2S #Stacks`
}
