'use client'

import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

// The station page's own chrome — the view tabs plus that view's filters —
// pinned as one block, so switching views and changing the window stay
// reachable while scrolling a long table or a tall column of charts.
//
// Below lg it clears the sticky mobile site header; the 4rem offset matches the
// `scroll-pt-16` the root layout uses to clear that same header. Above lg the
// site header doesn't stick, so this pins to the top of the viewport.
//
// The measured height lands on `--station-bar-height` because the Table view's
// own header row pins directly beneath this bar, and the bar's height moves
// with the viewport: the filter row wraps on narrow screens and the compare
// chips add a line of their own.
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
