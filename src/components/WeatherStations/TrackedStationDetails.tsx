import { normalizeSource, sourceLabel } from '@/services/snowobs/stationMap/format'
import type { TrackedStation } from '@/services/snowobs/stationTracking'
import { Handshake, Mountain, Tag } from 'lucide-react'

// The legacy station modal's metadata line: network, elevation and, where
// there is one, the partner that runs the station.
export function TrackedStationDetails({
  station,
}: {
  station: Pick<TrackedStation, 'source' | 'elevation' | 'partner'>
}) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1 uppercase">
        <Tag className="h-3.5 w-3.5" aria-hidden="true" />
        {sourceLabel(normalizeSource(station.source))}
      </span>
      {station.elevation !== null && (
        <span className="inline-flex items-center gap-1">
          <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Elevation </span>
          {Math.round(station.elevation)}&apos;
        </span>
      )}
      {station.partner && (
        <span className="inline-flex items-center gap-1">
          <Handshake className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Partner </span>
          {station.partner}
        </span>
      )}
    </div>
  )
}
