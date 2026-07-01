import { useEffect, useRef } from "react"

export function usePolling(callback, intervalMs = 30000, deps = []) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    const tick = () => savedCallback.current()
    tick()
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}