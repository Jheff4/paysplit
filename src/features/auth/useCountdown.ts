import { useEffect, useState } from 'react'

export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(Math.max(0, Math.floor(initialSeconds)))

  useEffect(() => {
    if (seconds <= 0) return
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])

  return [seconds, (next: number) => setSeconds(Math.max(0, Math.floor(next)))] as const
}
