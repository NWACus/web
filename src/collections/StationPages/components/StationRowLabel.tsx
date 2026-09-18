'use client'

import { useRowLabel } from '@payloadcms/ui'
import type { TrackedStations } from './useTrackedStations'
import { describeStation, useCenterSlug, useTrackedStations } from './useTrackedStations'

type RowData = { stid?: string; source?: string }

function labelFor(stid: string, source: string | undefined, tracked: TrackedStations): string {
  const match = tracked.stations.find((s) => s.stid === stid && s.source === source)
  if (match) return describeStation(match)
  const suffix = tracked.status === 'ready' ? ' — not tracked in SnowObs' : ''
  return `${stid} (${source ?? '?'})${suffix}`
}

// Collapsed rows show the live station, not the bare id.
export function StationRowLabel() {
  const { data, rowNumber } = useRowLabel<RowData>()
  const tracked = useTrackedStations(useCenterSlug())
  const position = rowNumber != null ? `${rowNumber + 1}. ` : ''
  return (
    <span>
      {position}
      {data.stid ? labelFor(data.stid, data.source, tracked) : 'New station'}
    </span>
  )
}
