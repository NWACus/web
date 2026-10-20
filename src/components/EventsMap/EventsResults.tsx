'use client'

import { EventsList } from '@/components/EventsList'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Event } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { List, Map as MapIcon } from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { EventsMapView, LIST_COLUMN_WIDTH } from './EventsMapView'
import { EventsSort } from './EventsSort'
import { useIsPhone } from './useIsPhone'

export const viewParam = parseAsStringLiteral(['list', 'map']).withDefault('list')

const resultsParams = {
  view: viewParam,
  // A searched map area only narrows the map view.
  bbox: parseAsString,
}

interface EventsResultsProps {
  initialEvents: Event[]
  initialHasMore: boolean
  initialError?: string
  center: string
  /** Filter dropdowns for the bar, shown in the wide map view in place of the filter sidebar. */
  filterMenus: ReactNode
}

type View = 'list' | 'map'

function ViewButtons({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={view}
      aria-label="Show events as"
      onValueChange={(value) => {
        if (value === 'map' || value === 'list') onChange(value)
      }}
    >
      {/* Icons alone on phones, leaving the sort button room for its place name. */}
      <ToggleGroupItem value="list" aria-label="List">
        <List />
        <span className="max-sm:hidden">List</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="map" aria-label="Map">
        <MapIcon />
        <span className="max-sm:hidden">Map</span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

const BAR_CLASSES = {
  list: { track: '', bar: '', wideMapOnly: 'hidden' },
  // Wide, the bar sticks with the map pinned below it while the page scrolls the list, and holds
  // the filters in place of the sidebar. It sticks within a track that ends one map height above
  // the results' end, so at the bottom of the page the bar and map scroll away together rather
  // than the map sliding up under the bar.
  map: {
    track:
      'xl:absolute xl:inset-x-0 xl:top-0 xl:bottom-[calc(100dvh-var(--view-bar)-1rem)] xl:pointer-events-none',
    bar: 'xl:sticky xl:top-0 xl:z-10 xl:bg-background xl:pointer-events-auto',
    wideMapOnly: 'hidden xl:flex',
  },
} satisfies Record<View, { track: string; bar: string; wideMapOnly: string }>

/** Whether the results have scrolled up under the bar. */
function useScrolledUnder(
  barRef: RefObject<HTMLDivElement | null>,
  resultsRef: RefObject<HTMLDivElement | null>,
) {
  const [scrolledUnder, setScrolledUnder] = useState(false)
  useEffect(() => {
    const update = () => {
      const bar = barRef.current?.getBoundingClientRect()
      const results = resultsRef.current?.getBoundingClientRect()
      setScrolledUnder(bar !== undefined && results !== undefined && results.top < bar.bottom - 1)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    // A filter that shortens the page can move the results without a scroll event.
    const resized = new ResizeObserver(update)
    resized.observe(document.body)
    return () => {
      window.removeEventListener('scroll', update)
      resized.disconnect()
    }
  }, [barRef, resultsRef])
  return scrolledUnder
}

function SortAndFilters({
  filterMenus,
  wideMapOnly,
}: {
  filterMenus: ReactNode
  wideMapOnly: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <EventsSort />
      <div
        className={cn(
          wideMapOnly,
          "items-center gap-2 before:h-6 before:w-px before:bg-border before:content-['']",
        )}
      >
        {filterMenus}
      </div>
    </div>
  )
}

/**
 * Under the bar once cards scroll beneath it, over the list only (the map stays put), as
 * Material's top app bar and Apple's scroll edge effect do.
 */
function ScrollShadow({ shown, className }: { shown: boolean; className: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        className,
        LIST_COLUMN_WIDTH,
        'pointer-events-none absolute left-0 top-full h-3 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.12),transparent)] opacity-0 transition-opacity',
        shown && 'opacity-100',
      )}
    />
  )
}

function ViewToggle({
  view,
  onChange,
  filterMenus,
  resultsRef,
}: {
  view: View
  onChange: (view: View) => void
  filterMenus: ReactNode
  resultsRef: RefObject<HTMLDivElement | null>
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const scrolledUnder = useScrolledUnder(barRef, resultsRef)
  // A phone's full-screen map carries its own List, Filters and sort buttons.
  const isPhone = useIsPhone()
  if (isPhone && view === 'map') return null
  const { track, bar, wideMapOnly } = BAR_CLASSES[view]
  return (
    // As tall as --view-bar; the negative margin keeps the buttons where a plain row would put them.
    <div className="h-[var(--view-bar)] -mt-4">
      <div className={track}>
        <div
          ref={barRef}
          className={cn(
            'relative flex items-center justify-between gap-2 h-[var(--view-bar)]',
            bar,
          )}
        >
          <SortAndFilters filterMenus={filterMenus} wideMapOnly={wideMapOnly} />
          <ViewButtons view={view} onChange={onChange} />
          <ScrollShadow shown={scrolledUnder} className={wideMapOnly} />
        </div>
      </div>
    </div>
  )
}

/** The events list, or the same events on a map. */
export function EventsResults({ center, filterMenus, ...listProps }: EventsResultsProps) {
  const [{ view }, setParams] = useQueryStates(resultsParams)
  // Only a click on Map scrolls the map into view; a page opened on the map view stays put.
  const [revealMap, setRevealMap] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  // Each switch is a history entry, so Back undoes it: on a phone the map fills the screen, and
  // Back leaving the page from there would surprise.
  const switchTo = (next: View) => {
    setRevealMap(next === 'map')
    setParams(next === 'map' ? { view: 'map' } : { view: null, bbox: null }, { history: 'push' })
  }

  return (
    <div className="relative [--view-bar:4.25rem]">
      <ViewToggle
        view={view}
        onChange={switchTo}
        filterMenus={filterMenus}
        resultsRef={resultsRef}
      />

      {/* The list stays mounted under the map so it keeps tracking filter changes. */}
      <div className={view === 'map' ? 'hidden' : undefined}>
        <EventsList center={center} {...listProps} />
      </div>
      {view === 'map' && (
        <div ref={resultsRef}>
          <EventsMapView
            center={center}
            revealOnMount={revealMap}
            onShowList={() => switchTo('list')}
          />
        </div>
      )}
    </div>
  )
}
