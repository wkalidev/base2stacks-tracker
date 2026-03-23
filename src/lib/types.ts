export interface Transaction {
  tx_id:               string
  tx_status:           string
  sender_address:      string
  burn_block_time_iso: string
  contract_call?: {
    function_name: string
    contract_id:   string
  }
}

export interface Wallet {
  address:   string
  balance:   number
  stx:       number
  connected: boolean
}

export interface PoolStats {
  reserveB2S: number
  reserveSTX: number
  totalLP:    number
  swapFee:    number
}

export interface StakeInfo {
  amount:      number
  lockedAt:    number
  lockBlocks:  number
  multiplier:  number
  unlockBlock: number
}

export interface Badge {
  id:          number
  name:        string
  rarity:      string
  type:        string
  requirement: number
}
