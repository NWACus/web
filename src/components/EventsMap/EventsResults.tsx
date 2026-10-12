'use client'

import { EventsList } from '@/components/EventsList'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Event } from '@/payload-types'
import { List, Map as MapIcon } from 'lucide-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { EventsMapView } from './EventsMapView'

const viewParam = parseAsStringLiteral(['list', 'map']).withDefault('list')

interface EventsResultsProps {
  initialEvents: Event[]
  initialHasMore: boolean
  initialError?: string
  center: string
}

/** The events list, or the same events on a map. */
export function EventsResults({ center, ...listProps }: EventsResultsProps) {
  const [view, setView] = useQueryState('view', viewParam)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={view}
          aria-label="Show events as"
          onValueChange={(value) => {
            if (value === 'map' || value === 'list') setView(value === 'list' ? null : value)
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

      {/* The list stays mounted under the map so it keeps tracking filter changes. */}
      <div className={view === 'map' ? 'hidden' : undefined}>
        <EventsList center={center} {...listProps} />
      </div>
      {view === 'map' && <EventsMapView center={center} />}
    </div>
  )
}
