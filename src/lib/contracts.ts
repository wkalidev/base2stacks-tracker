const ADDR = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'

export const CONTRACTS = {
  token:       `${ADDR}.b2s-token`,
  governance:  `${ADDR}.b2s-governance`,
  liquidity:   `${ADDR}.b2s-liquidity-pool-v5`,
  rewards:     `${ADDR}.b2s-rewards-distributor-v3`,
  badges:      `${ADDR}.b2s-badges`,
  marketplace: `${ADDR}.b2s-marketplace`,
  staking:     `${ADDR}.b2s-staking-vault-v2`,
  feeRouter:   `${ADDR}.b2s-fee-router`,
} as const

export type ContractName = keyof typeof CONTRACTS
