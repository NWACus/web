import { toStationRefs } from '@/fields/stations'
import type { StationPage } from '@/payload-types'
import type { StationRef } from '@/services/snowobs/snowobs'

// A page under /weather/stations: its row, with the stations in the order the
// editor arranged them. Everything a route needs; nothing a route has to look
// up again.
export type AssembledStationPage = {
  slug: string
  displayName: string
  archived: boolean
  stations: StationRef[]
  /** Station ids in page order -- the fetch list for tables, graphs and CSV. */
  stids: string[]
}

// What the client-side pickers need to list every page: small enough to pass
// as a prop, and free of anything that changes per request.
export type StationPageSummary = Pick<
  AssembledStationPage,
  'slug' | 'displayName' | 'archived' | 'stids'
>

type PageRow = Pick<StationPage, 'slug' | 'displayName' | 'archived' | 'stations'>

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
        stids: stations.map((s) => s.stid),
      }
    })
    .sort(byName)
}

export function toPageSummaries(pages: AssembledStationPage[]): StationPageSummary[] {
  return pages.map(({ slug, displayName, archived, stids }) => ({
    slug,
    displayName,
    archived,
    stids,
  }))
}

// Every station on any page, by stid: the allowlist for the graph-data route
// and the way a bare stid from a query string gets its source back.
export function allStations(pages: AssembledStationPage[]): Map<string, StationRef> {
  const byStid = new Map<string, StationRef>()
  for (const page of pages) {
    for (const { stid, source } of page.stations) byStid.set(stid, { stid, source })
  }
  return byStid
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
