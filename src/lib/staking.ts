export const LOCK_PERIODS = [
  { label: 'No lock',  blocks: 0,    multiplier: 1.0, apy: 12.5  },
  { label: '1 week',   blocks: 525,  multiplier: 1.5, apy: 18.75 },
  { label: '2 weeks',  blocks: 1050, multiplier: 2.0, apy: 25.0  },
  { label: '1 month',  blocks: 2100, multiplier: 3.0, apy: 37.5  },
]

export function getLockPeriod(blocks: number) {
  return LOCK_PERIODS.find(p => p.blocks === blocks) || LOCK_PERIODS[0]
}

export function calcRewards(amount: number, blocks: number, elapsed: number): number {
  const period = getLockPeriod(blocks)
  return amount * period.apy / 100 / 52560 * elapsed
}
