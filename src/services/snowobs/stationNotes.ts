import type { SnowObsTimeseriesResponse } from './types/schemas'

// Station notes as SnowObs serves them, surfaced so a reader knows why a
// number looks wrong. NWAC techs already maintain these — Timberline's gauge,
// for one, has carried "the precipitation gauge is not recording correctly,
// disregard values for now" since February 2026.

export type StationNote = {
  stid: string
  stationName: string
  note: string
  /** ISO date the note was raised; null when SnowObs didn't record one. */
  startDate: string | null
}

// Only `active` notes: `static` ones describe permanent characteristics of a
// site and would read as a standing alarm on every station, every day.
const ACTIVE_STATUS = 'active'

export function activeStationNotes(response: SnowObsTimeseriesResponse): StationNote[] {
  return response.STATION.flatMap((station) =>
    (station.station_note ?? []).flatMap((note) => {
      const text = note.note?.trim()
      if (!text || note.status !== ACTIVE_STATUS) return []
      return [
        {
          stid: station.stid,
          stationName: station.name ?? station.stid,
          note: text,
          startDate: note.start_date ?? null,
        },
      ]
    }),
  )
}

export function activeNotesByStid(response: SnowObsTimeseriesResponse): Map<string, StationNote[]> {
  const byStid = new Map<string, StationNote[]>()
  for (const note of activeStationNotes(response)) {
    byStid.set(note.stid, [...(byStid.get(note.stid) ?? []), note])
  }
  return byStid
}
