import type { StationNote } from './tableHelpers'
import { activeNotesFor } from './tableHelpers'
import type { SnowObsTimeseriesResponse } from './types/schemas'

// Newest first; undated notes keep their SnowObs order at the end.
export function activeStationNotes(response: SnowObsTimeseriesResponse): StationNote[] {
  return response.STATION.flatMap(activeNotesFor).sort((a, b) => raisedAt(b) - raisedAt(a))
}

function raisedAt(note: StationNote): number {
  const ms = note.startDate ? Date.parse(note.startDate) : Number.NaN
  return Number.isNaN(ms) ? -Infinity : ms
}
