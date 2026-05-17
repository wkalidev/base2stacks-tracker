import { useState, useEffect } from 'react'

export function useAPYHistory() {
  const [history, setHistory] = useState<{ date: string; apy: number }[]>([])

  useEffect(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toISOString().slice(0, 10).slice(5),
        apy:  12.5,
      }
    })
    setHistory(last30Days)
  }, [])

  return { history }
}
