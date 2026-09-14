import type { SnowObsTimeseriesResponse } from './types/schemas'

// Station notes as SnowObs serves them, so a reader knows why a number looks wrong.

export type StationNote = {
  stid: string
  stationName: string
  note: string
  /** ISO date the note was raised; null when SnowObs didn't record one. */
  startDate: string | null
}

type ResponseStation = SnowObsTimeseriesResponse['STATION'][number]

// Only `active` notes: `static` ones describe permanent site characteristics
// and would read as a standing alarm on most stations, every day.
export function activeNotesFor(station: ResponseStation): StationNote[] {
  return (station.station_note ?? []).flatMap((note) => {
    const text = note.note?.trim()
    if (!text || note.status !== 'active') return []
    return [
      {
        stid: station.stid,
        stationName: station.name ?? station.stid,
        note: text,
        startDate: note.start_date ?? null,
      },
    ]
  })
}

// Newest first; undated notes keep their SnowObs order at the end.
export function activeStationNotes(response: SnowObsTimeseriesResponse): StationNote[] {
  return response.STATION.flatMap(activeNotesFor).sort((a, b) => raisedAt(b) - raisedAt(a))
}

function raisedAt(note: StationNote): number {
  const ms = note.startDate ? Date.parse(note.startDate) : Number.NaN
  return Number.isNaN(ms) ? -Infinity : ms
}

export function activeNotesByStid(response: SnowObsTimeseriesResponse): Map<string, StationNote[]> {
  const byStid = new Map<string, StationNote[]>()
  for (const note of activeStationNotes(response)) {
    byStid.set(note.stid, [...(byStid.get(note.stid) ?? []), note])
  }
  return byStid
}
