import { useState, useEffect } from 'react'

export function useGovernanceBalance(balance: number) {
  const [canVote, setCanVote]       = useState(false)
  const [canPropose, setCanPropose] = useState(false)

  useEffect(() => {
    setCanVote(balance >= 1000)
    setCanPropose(balance >= 10000)
  }, [balance])

  return { canVote, canPropose }
}
