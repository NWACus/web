'use client'

/**
 * Section links as chips across the top of the card, pinned under the site header (the
 * top of the viewport on wide screens), with the section nearest the top of the viewport filled in.
 */
import { useEffect, useRef, useState, type RefObject } from 'react'

import { cn } from '@/utilities/ui'

export interface SectionLink {
  /** The target heading's element id. */
  id: string
  label: string
}

/**
 * The last section whose heading is above the upper third of the viewport, or just under where the
 * tabs pin when that is lower (a phone, under the site header). Measured only while the tabs are
 * visible, and again when they appear: hidden headings all read as at the top.
 */
function useCurrentSection(ids: string[], nav: RefObject<HTMLElement | null>) {
  const [current, setCurrent] = useState(ids[0])
  // A stable dependency: the caller builds a new array every render.
  const key = ids.join(' ')

  useEffect(() => {
    const ids = key.split(' ')
    const measure = () => {
      if (!nav.current?.offsetParent) return
      // Where the tabs pin, not where they are: before they pin they sit lower on the page.
      const pinned = parseFloat(getComputedStyle(nav.current).top) || 0
      const line = Math.max(window.innerHeight / 3, pinned + nav.current.offsetHeight + 72)
      let found = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) found = id
      }
      setCurrent(found)
    }
    measure()
    // Absent in jsdom; every browser the site supports has it.
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (nav.current) resize?.observe(nav.current)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      resize?.disconnect()
      window.removeEventListener('scroll', measure)
    }
  }, [key, nav])

  return current
}

export function SectionTabs({ links }: { links: SectionLink[] }) {
  const nav = useRef<HTMLElement>(null)
  const current = useCurrentSection(
    links.map((l) => l.id),
    nav,
  )
  useEffect(() => {
    const bar = nav.current
    const tab = bar?.querySelector('[aria-current]')
    if (!bar || !tab) return
    const edge = bar.getBoundingClientRect()
    const box = tab.getBoundingClientRect()
    // On a phone the tabs scroll sideways: bring the current one into view as the page moves.
    if (box.left < edge.left) bar.scrollBy({ left: box.left - edge.left - 16, behavior: 'smooth' })
    else if (box.right > edge.right)
      bar.scrollBy({ left: box.right - edge.right + 16, behavior: 'smooth' })
  }, [current])

  if (links.length === 0) return null

  return (
    <nav
      ref={nav}
      aria-label="Forecast sections"
      className={cn(
        'sticky top-[calc(var(--admin-bar-height,0px)+var(--sticky-header-height,4rem))] z-20 overflow-x-auto overflow-y-hidden rounded-t-lg border-b bg-card px-6 lg:top-0 print:hidden',
        // Edge to edge on a phone, whatever the page's side padding, so the page doesn't show past
        // it in the gutters as it scrolls: out to the viewport, padded back in to line up.
        'max-md:mx-[calc(50%-50vw)] max-md:rounded-none max-md:px-[calc(50vw-50%)]',
      )}
    >
      <ul className="flex gap-2 py-2.5">
        {links.map((l) => {
          const on = l.id === current
          return (
            <li key={l.id} className="shrink-0">
              <a
                href={`#${l.id}`}
                aria-current={on ? 'location' : undefined}
                className={cn(
                  'inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-sm font-semibold no-underline',
                  on
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:bg-muted',
                )}
              >
                {l.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
