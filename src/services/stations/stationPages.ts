import type { Station, StationPageDoc } from '@/payload-types'

export type StationPageStation = {
  stid: string
  name: string | null
  elevation: number | null
  hiddenOnPrecipTable: boolean
}

// A page under /weather/stations, assembled from its row and the stations that
// point at it. Everything a route needs; nothing a route has to look up again.
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

type PageRow = Pick<StationPageDoc, 'id' | 'slug' | 'displayName' | 'archived'>
type StationRow = Pick<
  Station,
  'stid' | 'name' | 'elevation' | 'page' | 'pageOrder' | 'hiddenOnPrecipTable'
>

function pageIdOf(station: StationRow): number | null {
  const page = station.page
  if (typeof page === 'number') return page
  if (page && typeof page === 'object') return page.id
  return null
}

// Explicit order first; blanks fall back to elevation, highest first, so a
// Summit / Mid / Base page reads top-down without anyone typing numbers.
function byPagePosition(a: StationRow, b: StationRow): number {
  const orderA = a.pageOrder ?? Number.POSITIVE_INFINITY
  const orderB = b.pageOrder ?? Number.POSITIVE_INFINITY
  if (orderA !== orderB) return orderA - orderB
  const elevationA = a.elevation ?? Number.NEGATIVE_INFINITY
  const elevationB = b.elevation ?? Number.NEGATIVE_INFINITY
  if (elevationA !== elevationB) return elevationB - elevationA
  return (a.name ?? '').localeCompare(b.name ?? '')
}

// A flat, alphabetical list: with a dropdown to jump between pages, headings
// bought less than they cost.
function byName(a: StationPage, b: StationPage): number {
  return a.displayName.localeCompare(b.displayName)
}

// Pure so it can be tested without a database.
export function assembleStationPages(pages: PageRow[], stations: StationRow[]): StationPage[] {
  const stationsByPage = new Map<number, StationRow[]>()
  for (const station of stations) {
    const pageId = pageIdOf(station)
    if (pageId == null) continue
    const list = stationsByPage.get(pageId) ?? []
    list.push(station)
    stationsByPage.set(pageId, list)
  }

  return pages
    .map((page): StationPage => {
      const members = (stationsByPage.get(page.id) ?? []).sort(byPagePosition)
      return {
        slug: page.slug,
        displayName: page.displayName,
        archived: page.archived ?? false,
        stations: members.map((s) => ({
          stid: s.stid,
          name: s.name ?? null,
          elevation: s.elevation ?? null,
          hiddenOnPrecipTable: s.hiddenOnPrecipTable ?? false,
        })),
        stids: members.map((s) => s.stid),
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

// Every station on a live page: the allowlist for the graph-data route.
export function allStationIds(pages: StationPage[]): Set<string> {
  return new Set(pages.flatMap((page) => page.stids))
}

// The Accumulated Precipitation rows: every station on a live page whose gauge
// isn't flagged. Which of those actually report precip is decided by the
// response -- a station without the sensor simply has no row. Archived pages
// are left out because a decommissioned gauge would read "missing" forever,
// which is why the legacy page omitted them too.
export function precipStationIds(pages: StationPage[]): string[] {
  return Array.from(
    new Set(
      pages
        .filter((page) => !page.archived)
        .flatMap((page) => page.stations)
        .filter((station) => !station.hiddenOnPrecipTable)
        .map((station) => station.stid),
    ),
  )
}
