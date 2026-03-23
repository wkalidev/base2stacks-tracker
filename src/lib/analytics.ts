export function trackEvent(name: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') return
  console.log('[Analytics]', name, props)
}

export function trackClaim(amount: number) {
  trackEvent('claim_reward', { amount })
}

export function trackStake(amount: number, lockBlocks: number) {
  trackEvent('stake', { amount, lockBlocks })
}

export function trackSwap(from: string, to: string, amount: number) {
  trackEvent('swap', { from, to, amount })
}

export function trackConnect(address: string) {
  trackEvent('wallet_connect', { address: address.slice(0, 8) })
}
