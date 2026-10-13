'use client'

import { EventsList } from '@/components/EventsList'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Event } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { List, Map as MapIcon } from 'lucide-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useState } from 'react'
import { EventsMapView } from './EventsMapView'

export const viewParam = parseAsStringLiteral(['list', 'map']).withDefault('list')

interface EventsResultsProps {
  initialEvents: Event[]
  initialHasMore: boolean
  initialError?: string
  center: string
}

type View = 'list' | 'map'

function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    // As tall as --view-bar; the negative margin keeps the buttons where a plain row would put them.
    // In the map view it sticks, with the map pinned below it, while the page scrolls the list.
    <div
      className={cn(
        'flex items-center justify-end h-[var(--view-bar)] -mt-4',
        view === 'map' && 'xl:sticky xl:top-0 xl:z-10 xl:bg-background',
      )}
    >
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
        <ToggleGroupItem value="list" aria-label="List">
          <List /> List
        </ToggleGroupItem>
        <ToggleGroupItem value="map" aria-label="Map">
          <MapIcon /> Map
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

/** The events list, or the same events on a map. */
export function EventsResults({ center, ...listProps }: EventsResultsProps) {
  const [view, setView] = useQueryState('view', viewParam)
  // Only a click on Map scrolls the map into view; a page opened on the map view stays put.
  const [revealMap, setRevealMap] = useState(false)

  return (
    <div className="[--view-bar:4.25rem]">
      <ViewToggle
        view={view}
        onChange={(next) => {
          setRevealMap(next === 'map')
          setView(next === 'list' ? null : next)
        }}
      />

      {/* The list stays mounted under the map so it keeps tracking filter changes. */}
      <div className={view === 'map' ? 'hidden' : undefined}>
        <EventsList center={center} {...listProps} />
      </div>
      {view === 'map' && <EventsMapView center={center} revealOnMount={revealMap} />}
    </div>
  )
}
