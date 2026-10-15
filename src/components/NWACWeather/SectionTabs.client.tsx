'use client'

/**
 * Section links as tabs across the top of the card, pinned on wide screens, with the section
 * nearest the top of the viewport marked current.
 */
import { useEffect, useRef, useState, type RefObject } from 'react'

import { cn } from '@/utilities/ui'

export interface SectionLink {
  /** The target heading's element id. */
  id: string
  label: string
}

/**
 * The last section whose heading is above the upper third of the viewport. Measured only while
 * the tabs are visible, and again when they appear: hidden headings all read as at the top.
 */
function useCurrentSection(ids: string[], nav: RefObject<HTMLElement | null>) {
  const [current, setCurrent] = useState(ids[0])
  // A stable dependency: the caller builds a new array every render.
  const key = ids.join(' ')

  useEffect(() => {
    const ids = key.split(' ')
    const measure = () => {
      if (!nav.current?.offsetParent) return
      const line = window.innerHeight / 3
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
  if (links.length === 0) return null

  return (
    <nav
      ref={nav}
      aria-label="Forecast sections"
      className="z-20 overflow-x-auto rounded-t-lg border-b bg-card px-6 lg:sticky lg:top-0 print:hidden"
    >
      <ul className="flex gap-6">
        {links.map((l) => {
          const on = l.id === current
          return (
            <li key={l.id} className="shrink-0">
              <a
                href={`#${l.id}`}
                aria-current={on ? 'location' : undefined}
                className={cn(
                  '-mb-px inline-flex h-12 items-center whitespace-nowrap border-b-2 text-sm font-semibold no-underline',
                  on
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
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
