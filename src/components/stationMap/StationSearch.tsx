'use client'

/**
 * The station search: the widget's fuzzy name lookup, whose results jump the map to a station or
 * webcam rather than filtering the markers.
 */
import Fuse from 'fuse.js'
import { Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import type { MapPoint } from '@/services/snowobs/stationMap/filters'
import { cn } from '@/utilities/ui'

interface Searchable {
  point: MapPoint
  name: string
  stid: string
}

function toSearchable(point: MapPoint): Searchable {
  return point.kind === 'station'
    ? { point, name: point.station.name, stid: point.station.stid }
    : { point, name: point.webcam.title, stid: '' }
}

const MAX_RESULTS = 10

function ResultList({
  id,
  results,
  onPick,
}: {
  id: string
  results: Searchable[]
  onPick: (point: MapPoint) => void
}) {
  return (
    <ul
      id={id}
      className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border bg-background py-1 text-sm shadow-lg"
    >
      {results.length === 0 && (
        <li className="px-2 py-1 italic text-muted-foreground">No results</li>
      )}
      {results.map((item) => (
        <li key={item.point.id}>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-muted"
            onClick={() => onPick(item.point)}
          >
            <span className="text-xs uppercase text-muted-foreground">
              {item.point.kind === 'webcam' ? 'Cam' : 'Stn'}
            </span>
            {item.name}
          </button>
        </li>
      ))}
    </ul>
  )
}

export function StationSearch({
  points,
  onSelect,
  className,
}: {
  points: MapPoint[]
  onSelect: (point: MapPoint) => void
  className?: string
}) {
  const [query, setQuery] = useState('')
  const listId = useId()
  const fuse = useMemo(
    () =>
      // The widget's Fuse settings: near-exact matching, over the whole name.
      new Fuse(points.map(toSearchable), {
        keys: ['name', 'stid'],
        threshold: 0.1,
        distance: 10000,
      }),
    [points],
  )
  const results = query
    ? fuse
        .search(query)
        .slice(0, MAX_RESULTS)
        .map((hit) => hit.item)
    : []

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center rounded-md border bg-background">
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for station..."
          aria-label="Search for station"
          aria-controls={listId}
          className="h-9 w-full bg-transparent px-2 text-sm outline-none"
        />
        {query && (
          <button
            type="button"
            className="px-2 text-muted-foreground"
            onClick={() => setQuery('')}
            title="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>
      {query && (
        <ResultList
          id={listId}
          results={results}
          onPick={(point) => {
            onSelect(point)
            setQuery('')
          }}
        />
      )}
    </div>
  )
}
