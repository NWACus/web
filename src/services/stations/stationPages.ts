import { toStationRefs } from '@/fields/stations'
import type { StationPage } from '@/payload-types'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationColumn } from './stationColumns'
import { toStationColumns } from './stationColumns'

// A page under /weather/stations: its row, with the stations in the order the
// editor arranged them. Everything a route needs; nothing a route has to look
// up again.
export type AssembledStationPage = {
  slug: string
  displayName: string
  archived: boolean
  stations: StationRef[]
  /** The readings the table shows, for every station; empty means all reported. */
  columns: StationColumn[]
}

// What the client-side pickers need to list every page: small enough to pass
// as a prop, and free of anything that changes per request.
export type StationPageSummary = Pick<
  AssembledStationPage,
  'slug' | 'displayName' | 'archived' | 'stations'
>

type PageRow = Pick<StationPage, 'slug' | 'displayName' | 'archived' | 'stations' | 'columns'>

// A flat, alphabetical list: with a dropdown to jump between pages, headings
// bought less than they cost.
function byName(a: AssembledStationPage, b: AssembledStationPage): number {
  return a.displayName.localeCompare(b.displayName)
}

// Pure so it can be tested without a database.
export function assembleStationPages(pages: PageRow[]): AssembledStationPage[] {
  return pages
    .map((page): AssembledStationPage => {
      const stations = toStationRefs(page.stations)
      return {
        slug: page.slug,
        displayName: page.displayName,
        archived: page.archived ?? false,
        stations,
        columns: toStationColumns(page.columns),
      }
    })
    .sort(byName)
}

export function toPageSummaries(pages: AssembledStationPage[]): StationPageSummary[] {
  return pages.map(({ slug, displayName, archived, stations }) => ({
    slug,
    displayName,
    archived,
    stations,
  }))
}

// Every station on any page, by `source:stid`: the allowlist for the graph-data
// route, which receives those keys and sends the references on to SnowObs.
export function allStations(pages: AssembledStationPage[]): Map<string, StationRef> {
  const byKey = new Map<string, StationRef>()
  for (const page of pages) {
    for (const station of page.stations) byKey.set(stationKey(station), station)
  }
  return byKey
}
// The Accumulated Precipitation rows: every station on a live page, in page
// order, as the legacy table showed. Archived pages are left out because a
// decommissioned gauge would read "missing" forever.
export function precipStations(pages: AssembledStationPage[]): StationRef[] {
  const seen = new Set<string>()
  const refs: StationRef[] = []
  for (const page of pages) {
    if (page.archived) continue
    for (const { stid, source } of page.stations) {
      if (seen.has(stid)) continue
      seen.add(stid)
      refs.push({ stid, source })
    }
  }
  return refs
}
