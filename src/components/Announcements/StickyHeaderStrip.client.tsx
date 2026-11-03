'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

// Publishes the strip's height as --sticky-header-height, so anything pinning below the mobile
// header clears it however tall the announcement banners make it.
export function StickyHeaderStrip({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const strip = ref.current
    if (!strip) return
    const root = document.documentElement
    const observer = new ResizeObserver(() => {
      root.style.setProperty('--sticky-header-height', `${strip.getBoundingClientRect().height}px`)
    })
    observer.observe(strip)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--sticky-header-height')
    }
  }, [])

  return (
    <div ref={ref} data-print-hide className={className}>
      {children}
    </div>
  )
}
