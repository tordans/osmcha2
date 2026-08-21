import { useEffect, useState } from 'react'

/** Re-renders once `dataUpdatedAt` is older than `staleAfterMs`. */
export function useStaleAfter(dataUpdatedAt: number, staleAfterMs: number) {
  const [now, setNow] = useState(() => Date.now())
  const staleAt = dataUpdatedAt + staleAfterMs

  useEffect(
    function scheduleStaleHint() {
      if (!dataUpdatedAt) return
      const remaining = staleAt - Date.now()
      if (remaining <= 0) return
      const timeout = window.setTimeout(() => setNow(Date.now()), remaining)
      return function clearStaleHint() {
        window.clearTimeout(timeout)
      }
    },
    [dataUpdatedAt, staleAt],
  )

  return dataUpdatedAt > 0 && now >= staleAt
}
