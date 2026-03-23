export const PLATFORM_FEE_BPS = 250  // 2.5%
export const MIN_PRICE        = 1    // 1 B2S

export function calcPlatformFee(price: number): number {
  return price * PLATFORM_FEE_BPS / 10000
}

export function calcSellerAmount(price: number): number {
  return price - calcPlatformFee(price)
}

export function isValidPrice(price: number): boolean {
  return price >= MIN_PRICE
}

export function formatListingPrice(price: number): string {
  if (price >= 1000) return `${(price / 1000).toFixed(1)}K $B2S`
  return `${price} $B2S`
}
