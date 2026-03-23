export const BADGE_TYPES = {
  BRONZE_STAKER:    { id: 1, name: 'Bronze Staker',    req: 100,     rarity: 'Common'    },
  SILVER_STAKER:    { id: 2, name: 'Silver Staker',    req: 1000,    rarity: 'Uncommon'  },
  GOLD_STAKER:      { id: 3, name: 'Gold Staker',      req: 10000,   rarity: 'Rare'      },
  DIAMOND_STAKER:   { id: 4, name: 'Diamond Staker',   req: 100000,  rarity: 'Epic'      },
  LEGENDARY_STAKER: { id: 5, name: 'Legendary Staker', req: 1000000, rarity: 'Legendary' },
  EARLY_ADOPTER:    { id: 6, name: 'Early Adopter',    req: 0,       rarity: 'Legendary' },
  LAUNCH_HERO:      { id: 7, name: 'Launch Hero',      req: 0,       rarity: 'Legendary' },
} as const

export function getEligibleBadge(stakedAmount: number) {
  if (stakedAmount >= 1000000) return BADGE_TYPES.LEGENDARY_STAKER
  if (stakedAmount >= 100000)  return BADGE_TYPES.DIAMOND_STAKER
  if (stakedAmount >= 10000)   return BADGE_TYPES.GOLD_STAKER
  if (stakedAmount >= 1000)    return BADGE_TYPES.SILVER_STAKER
  if (stakedAmount >= 100)     return BADGE_TYPES.BRONZE_STAKER
  return null
}
