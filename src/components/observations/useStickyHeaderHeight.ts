'use client'

/**
 * How far down the viewport the site's sticky header reaches below `lg` — the nav bar plus any
 * announcement banners, which open and collapse — so the phone layout fills the screen just under
 * it rather than sliding beneath it. Zero where the header doesn't stick (`lg` and up).
 */
import { useEffect, useState } from 'react'

export function useStickyHeaderHeight(): number {
  const [height, setHeight] = useState(64)
  useEffect(() => {
    const header = document.querySelector('[data-sticky-header]')
    if (!header) return
    const measure = () => {
      const sticks = window.getComputedStyle(header).position === 'sticky'
      setHeight(sticks ? header.getBoundingClientRect().height : 0)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  return height
}
