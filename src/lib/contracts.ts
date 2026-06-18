const ADDR = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export const CONTRACTS = {
  token:       `${ADDR}.b2s-token-v4`,
  governance:  `${ADDR}.b2s-governance`,
  liquidity:   `${ADDR}.b2s-liquidity-pool-v6`,
  rewards:     `${ADDR}.b2s-rewards-distributor`,
  badges:      `${ADDR}.b2s-badges`,
  marketplace: `${ADDR}.b2s-marketplace`,
  staking:     `${ADDR}.b2s-staking-vault-v2`,
  feeRouter:   `${ADDR}.b2s-fee-router`,
} as const

export type ContractName = keyof typeof CONTRACTS
