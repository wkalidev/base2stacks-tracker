export type ProposalCategory = 'economic' | 'security' | 'technical' | 'community'

export interface Proposal {
  id:          number
  title:       string
  description: string
  category:    ProposalCategory
  yesVotes:    number
  noVotes:     number
  status:      'active' | 'passed' | 'rejected' | 'pending'
  endBlock:    number
}

export function calcVoteResult(yesVotes: number, noVotes: number): 'pass' | 'fail' {
  const total = yesVotes + noVotes
  if (total === 0) return 'fail'
  return (yesVotes / total) >= 0.51 ? 'pass' : 'fail'
}

export function hasQuorum(totalVotes: number, totalSupply: number): boolean {
  return (totalVotes / totalSupply) >= 0.20
}
