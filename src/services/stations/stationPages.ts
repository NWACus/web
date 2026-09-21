import { toStationRefs } from '@/fields/stations'
import type { StationPage } from '@/payload-types'
import type { StationRef } from '@/services/snowobs/snowobs'
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
  /** Station ids in page order -- the fetch list for tables, graphs and CSV. */
  stids: string[]
  /** The readings the table shows, for every station; empty means all reported. */
  columns: StationColumn[]
}

// What the client-side pickers need to list every page: small enough to pass
// as a prop, and free of anything that changes per request.
export type StationPageSummary = Pick<
  AssembledStationPage,
  'slug' | 'displayName' | 'archived' | 'stids'
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
        stids: stations.map((s) => s.stid),
        columns: toStationColumns(page.columns),
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
// and the way a bare stid from a query string gets its source back. The field
// keeps a stid unique within a page; across pages the same id could sit under
// two sources, and such an id is left out so the route refuses it rather than
// fetching the wrong source.
export function allStations(pages: AssembledStationPage[]): Map<string, StationRef> {
  const byStid = new Map<string, StationRef>()
  for (const stid of ambiguousStids(pages)) byStid.set(stid, { stid, source: '' })
  for (const page of pages) {
    for (const { stid, source } of page.stations) {
      if (!byStid.has(stid)) byStid.set(stid, { stid, source })
    }
  }
  for (const stid of ambiguousStids(pages)) byStid.delete(stid)
  return byStid
}

// Station ids that appear under more than one source across a center's pages.
export function ambiguousStids(pages: AssembledStationPage[]): Set<string> {
  const sourcesByStid = new Map<string, Set<string>>()
  for (const page of pages) {
    for (const { stid, source } of page.stations) {
      sourcesByStid.set(stid, (sourcesByStid.get(stid) ?? new Set()).add(source))
    }
  }
  return new Set(Array.from(sourcesByStid).flatMap(([stid, s]) => (s.size > 1 ? [stid] : [])))
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
