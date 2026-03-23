export interface ProgressStep {
  id:        string
  label:     string
  completed: boolean
}

export const ONBOARDING_STEPS: ProgressStep[] = [
  { id: 'connect',  label: 'Connect wallet',      completed: false },
  { id: 'claim',    label: 'Claim daily reward',   completed: false },
  { id: 'stake',    label: 'Stake $B2S tokens',    completed: false },
  { id: 'badge',    label: 'Earn first NFT badge', completed: false },
  { id: 'vote',     label: 'Vote on proposal',     completed: false },
]

export function calcProgress(steps: ProgressStep[]): number {
  const done = steps.filter(s => s.completed).length
  return Math.round((done / steps.length) * 100)
}
