export const MIN_VOTE_AMOUNT     = 1000
export const MIN_PROPOSAL_AMOUNT = 10000
export const VOTING_PERIOD       = 1008  // ~1 week in blocks
export const QUORUM_PERCENT      = 20
export const APPROVAL_PERCENT    = 51

export function canVote(balance: number): boolean {
  return balance >= MIN_VOTE_AMOUNT
}

export function canPropose(balance: number): boolean {
  return balance >= MIN_PROPOSAL_AMOUNT
}

export function calcQuorum(totalVotes: number, totalSupply: number): number {
  return (totalVotes / totalSupply) * 100
}
