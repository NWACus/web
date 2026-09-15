'use client'

import { cn } from '@/utilities/ui'
import { useAnalytics } from '@/utilities/useAnalytics'
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import type { BreadcrumbItemData } from './buildBreadcrumbs'

const HOME_ITEM: BreadcrumbItemData = { name: 'Home', href: '/', isLast: false, isDerived: false }

// A crumb cut off mid-letter at a scroll edge reads as a rendering bug; fading it out reads as
// "there is more this way". A gradient fades the edge it runs away from.
const FADE_LEFT = '[mask-image:linear-gradient(to_right,transparent,black_2rem)]'
const FADE_RIGHT = '[mask-image:linear-gradient(to_left,transparent,black_2rem)]'
const FADE_BOTH =
  '[mask-image:linear-gradient(to_right,transparent,black_2rem),linear-gradient(to_left,transparent,black_2rem)] [mask-composite:intersect]'

function edgeFade({
  isScrollable,
  isAtStart,
  isAtEnd,
}: ReturnType<typeof useHorizontalScrollState>) {
  if (!isScrollable) return undefined
  if (isAtStart) return isAtEnd ? undefined : FADE_RIGHT
  return isAtEnd ? FADE_LEFT : FADE_BOTH
}

/**
 * A trail longer than the viewport scrolls sideways rather than clipping. CSS can't ask whether
 * a box overflows or where it sits, so measure it: being scrollable at all earns the box a tab
 * stop, and the scroll position decides which edges fade.
 */
function useHorizontalScrollState(items: BreadcrumbItemData[]) {
  const ref = useRef<HTMLOListElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(true)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    // Sub-pixel widths round differently across browsers, so ignore a pixel of slack.
    setIsScrollable(el.scrollWidth > el.clientWidth + 1)
    setIsAtStart(el.scrollLeft <= 1)
    setIsAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    measure()
    // A webfont swapping in changes how wide the trail draws without resizing the box the
    // observer watches, so that one moment has to be caught separately.
    document.fonts?.ready.then(measure)

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, items])

  return { ref, measure, isScrollable, isAtStart, isAtEnd }
}

export function BreadcrumbsList({ items }: { items: BreadcrumbItemData[] }) {
  const { captureWithTenant } = useAnalytics()
  const scroll = useHorizontalScrollState(items)

  const onClick = (item: BreadcrumbItemData, depth: string) => {
    captureWithTenant('breadcrumb_click', {
      breadcrumb_name: item.name,
      from_page: window.location.pathname,
      to_page: item.href ?? '',
      breadcrumb_level: depth,
    })
  }

  return (
    <Breadcrumb className="container md:max-xl:max-w-none py-4 md:py-6">
      <BreadcrumbList
        ref={scroll.ref}
        onScroll={scroll.measure}
        tabIndex={scroll.isScrollable ? 0 : undefined}
        className={cn(
          'flex-nowrap whitespace-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          // Tabbing to a crumb scrolls it into view; without this it lands under a fade and
          // disappears. The vertical padding keeps focus rings off the box's clipped edges.
          '[scroll-padding-inline:2rem] -my-1 py-1',
          // A mask clips the ring drawn on the same element, so the trail shows hard edges for
          // as long as the box itself is the thing being focused.
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:[mask-image:none]',
          edgeFade(scroll),
        )}
      >
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild onClick={() => onClick(HOME_ITEM, '0')}>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.length > 0 && <BreadcrumbSeparator />}
        {items.map((item, index) => (
          <React.Fragment key={`${item.name}__${item.href}__${index}`}>
            <BreadcrumbItem className="shrink-0">
              {item.isLast || !item.href ? (
                <BreadcrumbPage
                  className={cn(
                    item.isDerived && 'capitalize',
                    !item.isLast && 'text-muted-foreground',
                  )}
                  onClick={() => onClick(item, index.toString())}
                >
                  {item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild onClick={() => onClick(item, index.toString())}>
                  <Link href={item.href} className={cn(item.isDerived && 'capitalize')}>
                    {item.name}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
