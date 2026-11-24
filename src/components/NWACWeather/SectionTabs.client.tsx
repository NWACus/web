'use client'

/**
 * Section links as chips across the top of the card, pinned under the site header (the
 * top of the viewport on wide screens), with the section nearest the top of the viewport filled in, and any beside it.
 */
import { useEffect, useRef, useState, type RefObject } from 'react'

import { cn } from '@/utilities/ui'

export interface SectionLink {
  /** The target heading's element id. */
  id: string
  label: string
}

/** Headings this close in height are side by side; stacked ones have a table or text between. */
const SAME_ROW_PX = 24

/**
 * The last section whose heading is above the upper third of the viewport, or just under where the
 * tabs pin when that is lower (a phone, under the site header). Measured only while the tabs are
 * visible, and again when they appear: hidden headings all read as at the top. Sections side by side
 * with it are current too.
 */
function useCurrentSections(ids: string[], nav: RefObject<HTMLElement | null>) {
  // Joined, so an unchanged set doesn't render again.
  const [current, setCurrent] = useState(ids[0] ?? '')
  // A stable dependency: the caller builds a new array every render.
  const key = ids.join(' ')

  useEffect(() => {
    const ids = key.split(' ')
    const measure = () => {
      if (!nav.current?.offsetParent) return
      // Where the tabs pin, not where they are: before they pin they sit lower on the page.
      const pinned = parseFloat(getComputedStyle(nav.current).top) || 0
      const line = Math.max(window.innerHeight / 3, pinned + nav.current.offsetHeight + 72)
      const tops = ids.flatMap((id) => {
        const el = document.getElementById(id)
        return el ? [{ id, top: el.getBoundingClientRect().top }] : []
      })
      const found = tops.filter((t) => t.top <= line).at(-1) ?? tops[0]
      if (!found) return
      setCurrent(
        tops
          .filter((t) => Math.abs(t.top - found.top) <= SAME_ROW_PX)
          .map((t) => t.id)
          .join(' '),
      )
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

  return current.split(' ')
}

export function SectionTabs({ links }: { links: SectionLink[] }) {
  const nav = useRef<HTMLElement>(null)
  const current = useCurrentSections(
    links.map((l) => l.id),
    nav,
  )
  const currentKey = current.join(' ')
  useEffect(() => {
    const bar = nav.current
    const tabs = bar?.querySelectorAll('[aria-current]')
    if (!bar || !tabs?.length) return
    const edge = bar.getBoundingClientRect()
    const left = tabs[0].getBoundingClientRect().left
    const right = tabs[tabs.length - 1].getBoundingClientRect().right
    // On a phone the tabs scroll sideways: bring the current ones into view as the page moves.
    if (left < edge.left) bar.scrollBy({ left: left - edge.left - 16, behavior: 'smooth' })
    else if (right > edge.right) bar.scrollBy({ left: right - edge.right + 16, behavior: 'smooth' })
  }, [currentKey])

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
          const on = current.includes(l.id)
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
