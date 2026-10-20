'use client'

import { EventsList } from '@/components/EventsList'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Event } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { List, Map as MapIcon } from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { EventsMapView } from './EventsMapView'
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
}

type View = 'list' | 'map'

function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  // A phone's full-screen map carries its own List, Filters and sort buttons.
  const isPhone = useIsPhone()
  if (isPhone && view === 'map') return null
  return (
    // As tall as --view-bar; the negative margin keeps the buttons where a plain row would put them.
    // In the map view it sticks, with the map pinned below it, while the page scrolls the list.
    <div
      className={cn(
        'flex items-center justify-between gap-2 h-[var(--view-bar)] -mt-4',
        view === 'map' && 'xl:sticky xl:top-0 xl:z-10 xl:bg-background',
      )}
    >
      <EventsSort />
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
    </div>
  )
}

/** The events list, or the same events on a map. */
export function EventsResults({ center, ...listProps }: EventsResultsProps) {
  const [{ view }, setParams] = useQueryStates(resultsParams)
  // Only a click on Map scrolls the map into view; a page opened on the map view stays put.
  const [revealMap, setRevealMap] = useState(false)
  // Each switch is a history entry, so Back undoes it: on a phone the map fills the screen, and
  // Back leaving the page from there would surprise.
  const switchTo = (next: View) => {
    setRevealMap(next === 'map')
    setParams(next === 'map' ? { view: 'map' } : { view: null, bbox: null }, { history: 'push' })
  }

  return (
    <div className="[--view-bar:4.25rem]">
      <ViewToggle view={view} onChange={switchTo} />

      {/* The list stays mounted under the map so it keeps tracking filter changes. */}
      <div className={view === 'map' ? 'hidden' : undefined}>
        <EventsList center={center} {...listProps} />
      </div>
      {view === 'map' && (
        <EventsMapView
          center={center}
          revealOnMount={revealMap}
          onShowList={() => switchTo('list')}
        />
      )}
    </div>
  )
}
