import { toStationRefs } from '@/fields/stations'
import type { StationPage } from '@/payload-types'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationColumn } from './stationColumns'
import { toStationColumns } from './stationColumns'

export type AssembledStationPage = {
  slug: string
  displayName: string
  archived: boolean
  stations: StationRef[]
  /** The readings the table shows, for every station; empty means all reported. */
  columns: StationColumn[]
}

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

// The graph-data route's allowlist, by `source:stid`.
export function allStations(pages: AssembledStationPage[]): Map<string, StationRef> {
  const byKey = new Map<string, StationRef>()
  for (const page of pages) {
    for (const station of page.stations) byKey.set(stationKey(station), station)
  }
  return byKey
}
// Archived pages are left out: a decommissioned gauge would read "missing" forever.
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
