import type { Station, StationGroup } from '@/payload-types'

// Optional per-page floors for the graph axes; blank means the preset default.
export type GraphAxisFloors = {
  snowDepthMax?: number | null
  snowfall24Max?: number | null
  precipMax?: number | null
}

export type StationPageStation = {
  stid: string
  name: string | null
  elevation: number | null
  hiddenOnPrecipTable: boolean
}

// A page under /weather/stations, assembled from a group and the stations that
// point at it. Everything a route needs; nothing a route has to look up again.
export type StationPage = {
  slug: string
  displayName: string
  archived: boolean
  stations: StationPageStation[]
  /** Station ids in page order -- the fetch list for tables, graphs and CSV. */
  stids: string[]
  graphAxes: GraphAxisFloors
}

// What the client-side pickers need to list every page: small enough to pass
// as a prop, and free of anything that changes per request.
export type StationPageSummary = Pick<StationPage, 'slug' | 'displayName' | 'archived' | 'stids'>

type GroupRow = Pick<StationGroup, 'id' | 'slug' | 'displayName' | 'archived' | 'graphAxes'>
type StationRow = Pick<
  Station,
  'stid' | 'name' | 'elevation' | 'group' | 'groupOrder' | 'hiddenOnPrecipTable'
>

function groupIdOf(station: StationRow): number | null {
  const group = station.group
  if (typeof group === 'number') return group
  if (group && typeof group === 'object') return group.id
  return null
}

// Explicit order first; blanks fall back to elevation, highest first, so a
// Summit / Mid / Base page reads top-down without anyone typing numbers.
function byPagePosition(a: StationRow, b: StationRow): number {
  const orderA = a.groupOrder ?? Number.POSITIVE_INFINITY
  const orderB = b.groupOrder ?? Number.POSITIVE_INFINITY
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
export function assembleStationPages(groups: GroupRow[], stations: StationRow[]): StationPage[] {
  const stationsByGroup = new Map<number, StationRow[]>()
  for (const station of stations) {
    const groupId = groupIdOf(station)
    if (groupId == null) continue
    const list = stationsByGroup.get(groupId) ?? []
    list.push(station)
    stationsByGroup.set(groupId, list)
  }

  return groups
    .map((group): StationPage => {
      const members = (stationsByGroup.get(group.id) ?? []).sort(byPagePosition)
      return {
        slug: group.slug,
        displayName: group.displayName,
        archived: group.archived ?? false,
        stations: members.map((s) => ({
          stid: s.stid,
          name: s.name ?? null,
          elevation: s.elevation ?? null,
          hiddenOnPrecipTable: s.hiddenOnPrecipTable ?? false,
        })),
        stids: members.map((s) => s.stid),
        graphAxes: {
          snowDepthMax: group.graphAxes?.snowDepthMax ?? null,
          snowfall24Max: group.graphAxes?.snowfall24Max ?? null,
          precipMax: group.graphAxes?.precipMax ?? null,
        },
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
