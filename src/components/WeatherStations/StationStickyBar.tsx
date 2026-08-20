'use client'

import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

// View tabs plus that view's filters, pinned as one block. The 4rem offset
// clears the sticky mobile site header, matching the root layout's
// `scroll-pt-16`; above lg that header doesn't stick.
//
// The height is measured rather than assumed — the filter row wraps and the
// compare chips add a line.
export function StationStickyBar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = ref.current
    if (!bar) return

    const publishHeight = () => {
      document.documentElement.style.setProperty('--station-bar-height', `${bar.offsetHeight}px`)
    }
    publishHeight()

    const observer = new ResizeObserver(publishHeight)
    observer.observe(bar)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--station-bar-height')
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'sticky top-16 z-20 flex flex-col gap-3 border-b bg-background pb-2 pt-2 lg:top-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
