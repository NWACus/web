'use client'

import { TableHeader } from '@/components/ui/table'
import { cn } from '@/utilities/ui'
import type { ComponentProps, ReactNode, RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

type ScrollEdges = { left: boolean; right: boolean; pinnedWidth: number }

// Which sides have columns out of view, and how wide the pinned first column
// is, so the left shadow starts where the columns slide under it.
function useScrollEdges(ref: RefObject<HTMLDivElement | null>): ScrollEdges {
  const [edges, setEdges] = useState<ScrollEdges>({ left: false, right: false, pinnedWidth: 0 })
  useEffect(() => {
    const box = ref.current
    if (!box) return
    const update = () => {
      const pinned = box.querySelector('th:first-child')
      setEdges({
        left: box.scrollLeft > 0,
        right: box.scrollLeft + box.clientWidth < box.scrollWidth - 1,
        pinnedWidth: pinned instanceof HTMLElement ? pinned.offsetWidth : 0,
      })
    }
    update()
    box.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(box)
    if (box.firstElementChild) observer.observe(box.firstElementChild)
    return () => {
      box.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [ref])
  return edges
}

const shadowClass =
  'pointer-events-none absolute bottom-0 top-0 z-40 w-6 from-foreground/15 to-transparent transition-opacity'

// A sticky header sticks to the nearest scroll container, so at every width
// this wrapper scrolls both ways, capped at the viewport: a page can add
// stations until the table outgrows any container. Soft shadows mark the sides
// with columns out of view. The region makes the box reachable by keyboard.
export function StationTableFrame({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { left, right, pinnedWidth } = useScrollEdges(ref)
  return (
    <div className="relative w-full">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="relative w-full max-h-[calc(100dvh-5rem)] overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:max-h-[calc(100dvh-2rem)]"
      >
        <table className={cn('w-full caption-bottom text-sm', className)}>{children}</table>
      </div>
      <div
        aria-hidden
        className={cn(shadowClass, 'bg-gradient-to-r', left ? 'opacity-100' : 'opacity-0')}
        style={{ left: pinnedWidth }}
      />
      <div
        aria-hidden
        className={cn(shadowClass, 'right-0 bg-gradient-to-l', right ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  )
}

// Sticky lives on the cells: a sticky thead lags behind a fling on iOS. The
// corner cell stacks above the rest so the other headers slide under it.
// Collapsed row borders don't move with a stuck header, so cells draw their own.
export function StationTableHeader({ className, ...props }: ComponentProps<typeof TableHeader>) {
  return (
    <TableHeader
      className={cn(
        '[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background [&_th]:shadow-[inset_0_-1px_0_var(--border)] [&_th:first-child]:z-30',
        className,
      )}
      {...props}
    />
  )
}
