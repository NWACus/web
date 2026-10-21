import { toStationEntries } from '@/fields/stations'
import type { StationPage } from '@/payload-types'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { ColumnOrderEntry, StationEntry } from './stationColumns'
import { toColumnOrder } from './stationColumns'
import type { StationTabKey } from './stationTabs'
import { toStationTabs } from './stationTabs'

export type AssembledStationPage = {
  slug: string
  displayName: string
  archived: boolean
  stations: StationEntry[]
  /** The table's columns in order; empty means the default order. */
  columnOrder: ColumnOrderEntry[]
  tabs: StationTabKey[]
}

export type StationPageSummary = Pick<
  AssembledStationPage,
  'slug' | 'displayName' | 'archived' | 'stations'
>

type PageRow = Pick<
  StationPage,
  'slug' | 'displayName' | 'archived' | 'stations' | 'columnOrder' | 'tabs'
>

// A flat, alphabetical list: with a dropdown to jump between pages, headings
// bought less than they cost.
function byName(a: AssembledStationPage, b: AssembledStationPage): number {
  return a.displayName.localeCompare(b.displayName)
}

export function assembleStationPages(pages: PageRow[]): AssembledStationPage[] {
  return pages
    .map((page): AssembledStationPage => {
      const stations = toStationEntries(page.stations)
      return {
        slug: page.slug,
        displayName: page.displayName,
        archived: page.archived ?? false,
        stations,
        columnOrder: toColumnOrder(page.columnOrder),
        // A retired station reports nothing, so only its download is useful.
        tabs: page.archived ? ['csv'] : toStationTabs(page.tabs),
      }
    })
    .sort(byName)
}

export function toPageSummaries(pages: AssembledStationPage[]): StationPageSummary[] {
  return pages.map(({ slug, displayName, archived, stations }) => ({
    slug,
    displayName,
    archived,
    stations: stations.map(({ stid, source }) => ({ stid, source })),
  }))
}

/**
 * The station page a single station's detail page offers as its area (the widget modal's "Area
 * Tables" and "Area Graphs"): a live page over an archived one, else the first that lists it.
 */
export function areaPageFor(
  pages: StationPageSummary[],
  station: StationRef,
): StationPageSummary | null {
  const key = stationKey(station)
  const listing = pages.filter((page) => page.stations.some((s) => stationKey(s) === key))
  return listing.find((page) => !page.archived) ?? listing[0] ?? null
}

export function stationPagePath(slug: string): string {
  return `/weather/stations/${slug}`
}

// The graph-data route's allowlist, by `source:stid`.
export function allStations(pages: AssembledStationPage[]): Map<string, StationRef> {
  const byKey = new Map<string, StationRef>()
  for (const page of pages) {
    for (const station of page.stations) byKey.set(stationKey(station), station)
  }
  return byKey
}
