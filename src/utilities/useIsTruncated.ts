'use client'

import { useEffect, useState } from 'react'

/**
 * Whether an element's text is clipped to its line, rechecked as the layout resizes. A callback
 * ref, so it follows the element when it moves (a plain line becoming a disclosure).
 */
export function useIsTruncated() {
  const [el, ref] = useState<HTMLElement | null>(null)
  const [truncated, setTruncated] = useState(false)
  useEffect(() => {
    if (!el) return
    const check = () => setTruncated(el.scrollWidth > el.clientWidth)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [el])
  return { ref, truncated }
}
