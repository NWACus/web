'use client'

import { TableHeader } from '@/components/ui/table'
import { cn } from '@/utilities/ui'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

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

// The header is stuck once the pin, which rests level with the real header,
// has been held below it by the page scrolling.
function useStuckHeader(
  pinRef: RefObject<HTMLDivElement | null>,
  tableRef: RefObject<HTMLTableElement | null>,
): { stuck: boolean; headHeight: number } {
  const [stuck, setStuck] = useState(false)
  const [headHeight, setHeadHeight] = useState(0)
  useEffect(() => {
    const head = tableRef.current?.tHead
    if (!head) return
    const update = () => {
      const pin = pinRef.current
      if (!pin) return
      setStuck(pin.getBoundingClientRect().top > head.getBoundingClientRect().top + 0.5)
    }
    const measure = () => {
      setHeadHeight(head.getBoundingClientRect().height)
      update()
    }
    measure()
    // Capture catches whichever ancestor scrolls the page.
    document.addEventListener('scroll', update, { capture: true, passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(head)
    return () => {
      document.removeEventListener('scroll', update, { capture: true })
      observer.disconnect()
    }
  }, [pinRef, tableRef])
  return { stuck, headHeight }
}

// Copies the real header's column widths onto the copy and follows the
// table's sideways scroll, so the two line up column for column.
function useHeaderCopy(
  copyRef: RefObject<HTMLDivElement | null>,
  tableRef: RefObject<HTMLTableElement | null>,
  scrollRef: RefObject<HTMLDivElement | null>,
) {
  useLayoutEffect(() => {
    const box = copyRef.current
    const table = tableRef.current
    const scroller = scrollRef.current
    const copy = box?.querySelector('table')
    if (!box || !table || !scroller || !copy) return
    const sync = () => {
      copy.style.width = `${table.getBoundingClientRect().width}px`
      const cells = table.tHead?.querySelectorAll('th') ?? []
      copy.querySelectorAll('th').forEach((cell, index) => {
        const width = cells[index]?.getBoundingClientRect().width
        if (width) cell.style.width = `${width}px`
      })
      box.scrollLeft = scroller.scrollLeft
    }
    sync()
    // The copy is aria-hidden, so its sort buttons stay out of the tab order.
    copy.querySelectorAll('button, a[href], [tabindex]').forEach((el) => {
      el.setAttribute('tabindex', '-1')
    })
    const follow = () => {
      box.scrollLeft = scroller.scrollLeft
    }
    scroller.addEventListener('scroll', follow, { passive: true })
    const observer = new ResizeObserver(sync)
    observer.observe(table)
    return () => {
      scroller.removeEventListener('scroll', follow)
      observer.disconnect()
    }
  })
}

// Sticks below the mobile site header plus whatever view bar pins above the
// table, which sets --station-bar-h; above lg the site header doesn't stick.
const pinTop = 'top-[calc(4rem+var(--station-bar-h,0px))] lg:top-[var(--station-bar-h,0px)]'

// Collapsed row borders don't move with a stuck header, so cells draw their own.
const headClass = '[&_th]:bg-background [&_th]:shadow-[inset_0_-1px_0_var(--border)]'

function HeaderCopy({
  header,
  className,
  tableRef,
  scrollRef,
}: {
  header: ReactNode
  className?: string
  tableRef: RefObject<HTMLTableElement | null>
  scrollRef: RefObject<HTMLDivElement | null>
}) {
  const copyRef = useRef<HTMLDivElement>(null)
  useHeaderCopy(copyRef, tableRef, scrollRef)
  return (
    <div ref={copyRef} aria-hidden className="pointer-events-auto overflow-hidden">
      <table className={cn('caption-bottom table-fixed text-sm', className)}>
        <TableHeader className={headClass}>{header}</TableHeader>
      </table>
    </div>
  )
}

const shadowClass = 'pointer-events-none absolute bottom-0 top-0 z-40 w-6 transition-opacity'

// Theme colors are bare CSS variables, so Tailwind can't fade them; mix one inline.
function shadow(direction: 'right' | 'left'): string {
  return `linear-gradient(to ${direction}, color-mix(in srgb, var(--foreground) 15%, transparent), transparent)`
}

// The table grows to its full height so the page does the vertical scrolling;
// only columns that don't fit scroll, inside the frame. A box that scrolls
// sideways traps `position: sticky`, so once the header scrolls under the pin
// line a copy of it pins to the page instead. Soft shadows mark the sides with
// columns out of view. The region makes the box reachable by keyboard.
export function StationTableFrame({
  label,
  className,
  header,
  children,
}: {
  label: string
  className?: string
  /** The header row(s); the frame renders the `thead`. */
  header: ReactNode
  children: ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const { left, right, pinnedWidth } = useScrollEdges(scrollRef)
  const { stuck, headHeight } = useStuckHeader(pinRef, tableRef)
  // Isolated so the shadows and pinned header stay under the pinned view bar.
  return (
    <div className="relative isolate w-full">
      <div
        ref={scrollRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="relative isolate w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <table ref={tableRef} className={cn('w-full caption-bottom text-sm', className)}>
          <TableHeader className={headClass}>{header}</TableHeader>
          {children}
        </table>
      </div>
      {/* Ends a header's height short of the frame, so the pinned copy is pushed
          off with the last row rather than hanging below the table. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30"
        style={{ bottom: headHeight }}
      >
        <div ref={pinRef} className={cn('sticky h-0', pinTop)}>
          {stuck && (
            <HeaderCopy
              header={header}
              className={className}
              tableRef={tableRef}
              scrollRef={scrollRef}
            />
          )}
        </div>
      </div>
      <div
        aria-hidden
        className={cn(shadowClass, left ? 'opacity-100' : 'opacity-0')}
        style={{ left: pinnedWidth, background: shadow('right') }}
      />
      <div
        aria-hidden
        className={cn(shadowClass, 'right-0', right ? 'opacity-100' : 'opacity-0')}
        style={{ background: shadow('left') }}
      />
    </div>
  )
}
