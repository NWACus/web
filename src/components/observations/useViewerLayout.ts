'use client'

/**
 * The scroll mechanics of the viewer's two layouts, after the events map (#1420).
 *
 * Side by side (`lg` up) the toolbar is a sticky bar whose height is `--view-bar`; the map pins
 * under it and the list scrolls with the page. In the phone layout the viewer fills the screen
 * under the site header, the map fills the rest, and the list rests 60% of the way down it in its
 * own scroller, sliding up over the map; while it covers the map the page holds still.
 */
import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

import { isSideBySide } from './sideBySide'

/** Where the phone list's top edge rests, as a share of the map's height. */
const LIST_TOP = 0.6

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

function useHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(() => setHeight(node.offsetHeight))
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return height
}

/** Whether the phone list has scrolled up far enough to cover the whole map. */
function useListCoversMap(scrollerRef: RefObject<HTMLElement | null>, coveredAt: number) {
  const [covers, setCovers] = useState(false)
  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    const update = () => setCovers(coveredAt > 0 && node.scrollTop >= coveredAt - 1)
    update()
    node.addEventListener('scroll', update, { passive: true })
    return () => node.removeEventListener('scroll', update)
  }, [scrollerRef, coveredAt])
  return covers
}

/** The page behind the map stays put while the list covers it. */
function useLockPageScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [active])
}

/** Whether list cards have scrolled up under the sticky bar, for the shadow that marks it. */
function useScrolledUnder(
  barRef: RefObject<HTMLElement | null>,
  listRef: RefObject<HTMLElement | null>,
) {
  const [under, setUnder] = useState(false)
  useEffect(() => {
    const update = () => {
      const bar = barRef.current?.getBoundingClientRect()
      const list = listRef.current?.getBoundingClientRect()
      setUnder(bar !== undefined && list !== undefined && list.top < bar.bottom - 1)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    // A shorter list can move the cards without a scroll event.
    const resized = new ResizeObserver(update)
    resized.observe(document.body)
    return () => {
      window.removeEventListener('scroll', update)
      resized.disconnect()
    }
  }, [barRef, listRef])
  return under
}

/** Scroll the page so the list's top sits just under the sticky bar, if it has gone above it. */
function revealUnderBar(bar: HTMLElement | null, list: HTMLElement | null) {
  if (!bar || !list) return
  const gap = list.getBoundingClientRect().top - bar.getBoundingClientRect().bottom
  if (gap < 0) window.scrollBy({ top: gap, behavior: scrollBehavior() })
}

interface LayoutRefs {
  barRef: RefObject<HTMLDivElement | null>
  frameRef: RefObject<HTMLDivElement | null>
  scrollerRef: RefObject<HTMLDivElement | null>
  listRef: RefObject<HTMLDivElement | null>
}

export function useViewerLayout({ barRef, frameRef, scrollerRef, listRef }: LayoutRefs) {
  const barHeight = useHeight(barRef)
  const restingTop = Math.round(useHeight(frameRef) * LIST_TOP)
  const listCoversMap = useListCoversMap(scrollerRef, restingTop)
  useLockPageScroll(listCoversMap)
  const scrolledUnder = useScrolledUnder(barRef, listRef)

  return {
    barHeight,
    restingTop,
    listCoversMap,
    scrolledUnder,
    showMap: () => scrollerRef.current?.scrollTo({ top: 0, behavior: scrollBehavior() }),
    /** After a page change: bring the count line into view, under the bar or at the map's top. */
    revealList: () =>
      isSideBySide()
        ? revealUnderBar(barRef.current, listRef.current)
        : scrollerRef.current?.scrollTo({ top: restingTop, behavior: scrollBehavior() }),
  }
}
