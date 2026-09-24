'use client'

/**
 * Whether the list has slid up over the phone layout's sticky map — the widget shows its "↑ Map"
 * button past that point. Measured from the list's own top edge, since the map itself never
 * leaves the viewport (it is sticky; the list covers it).
 */
import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

/** How far under the sticky header the list's top edge is once it has covered the map. */
const COVERED_MARGIN_PX = 56

export function useScrolledPast(
  listRef: RefObject<HTMLElement | null>,
  headerHeight: number,
): boolean {
  const [covered, setCovered] = useState(false)
  useEffect(() => {
    const update = () => {
      const top = listRef.current?.getBoundingClientRect().top
      setCovered(top !== undefined && top < headerHeight + COVERED_MARGIN_PX)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [listRef, headerHeight])
  return covered
}
