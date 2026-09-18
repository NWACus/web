import type { StationPageDoc } from '@/payload-types'
import type { StationRef } from '@/services/snowobs/snowobs'

export type StationPageStation = StationRef & { hiddenOnPrecipTable: boolean }

// A page under /weather/stations: its row, with the stations in the order the
// editor arranged them. Everything a route needs; nothing a route has to look
// up again.
export type StationPage = {
  slug: string
  displayName: string
  archived: boolean
  stations: StationPageStation[]
  /** Station ids in page order -- the fetch list for tables, graphs and CSV. */
  stids: string[]
}

// What the client-side pickers need to list every page: small enough to pass
// as a prop, and free of anything that changes per request.
export type StationPageSummary = Pick<StationPage, 'slug' | 'displayName' | 'archived' | 'stids'>

type PageRow = Pick<StationPageDoc, 'slug' | 'displayName' | 'archived' | 'stations'>

// A flat, alphabetical list: with a dropdown to jump between pages, headings
// bought less than they cost.
function byName(a: StationPage, b: StationPage): number {
  return a.displayName.localeCompare(b.displayName)
}

// Pure so it can be tested without a database.
export function assembleStationPages(pages: PageRow[]): StationPage[] {
  return pages
    .map((page): StationPage => {
      const stations = (page.stations ?? []).map((s) => ({
        stid: s.stid,
        source: s.source,
        hiddenOnPrecipTable: s.hiddenOnPrecipTable ?? false,
      }))
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

export function toPageSummaries(pages: StationPage[]): StationPageSummary[] {
  return pages.map(({ slug, displayName, archived, stids }) => ({
    slug,
    displayName,
    archived,
    stids,
  }))
}

// Every station on any page, by stid: the allowlist for the graph-data route
// and the way a bare stid from a query string gets its source back.
export function allStations(pages: StationPage[]): Map<string, StationRef> {
  const byStid = new Map<string, StationRef>()
  for (const page of pages) {
    for (const { stid, source } of page.stations) byStid.set(stid, { stid, source })
  }
  return byStid
}

// The Accumulated Precipitation rows: every station on a live page whose gauge
// isn't flagged. Which of those actually report precip is decided by the
// response -- a station without the sensor simply has no row. Archived pages
// are left out because a decommissioned gauge would read "missing" forever,
// which is why the legacy page omitted them too.
export function precipStations(pages: StationPage[]): StationRef[] {
  const seen = new Set<string>()
  const refs: StationRef[] = []
  for (const page of pages) {
    if (page.archived) continue
    for (const { stid, source, hiddenOnPrecipTable } of page.stations) {
      if (hiddenOnPrecipTable || seen.has(stid)) continue
      seen.add(stid)
      refs.push({ stid, source })
    }
  }
  return refs
}
