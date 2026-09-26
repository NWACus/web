/**
 * The native forecast archive browser: every forecast and summary product a center has published,
 * filterable by season and date range, zone, danger and product type — as a list, fifty to a
 * page, each row linking to its dated forecast view, or as a danger-over-time chart per zone — and
 * every mountain-weather product, filterable by season and date range alone. Rebuilds the legacy
 * afp archive browser's forecast, visual and weather tabs (inventory rows F3 and F8).
 *
 * Server-rendered from the URL: the filters live in the query string, the season's archive comes
 * from the same trimmed, 30-minute-cached fetch the date picker uses, and everything else is
 * pure functions in `@/services/nac/forecastArchive`. A filtered view is therefore a shareable
 * address, and the client ships only the filter controls.
 */
import { AlertCircle, Search } from 'lucide-react'

import { ForecastDisclaimer } from '@/components/forecast/ForecastDisclaimer'
import { ForecastErrorBoundary } from '@/components/forecast/ForecastErrorBoundary'
import type { ArchiveProductSummary } from '@/services/nac/archiveDates'
import {
  ARCHIVE_PATH,
  ARCHIVE_WEATHER_PATH,
  DEFAULT_ARCHIVE_START_SEASON,
  applyArchiveFilters,
  buildArchiveRows,
  buildDangerOverTime,
  dangerCounts,
  paginateArchiveRows,
  resolveArchiveFilters,
  seasonOptions,
  todayInTimezone,
  type ArchiveQuery,
  type ArchiveRow,
  type ArchiveView,
  type ArchiveZone,
  type ArchiveFilters as ResolvedArchiveFilters,
} from '@/services/nac/forecastArchive'
import {
  fetchProductArchiveOrThrow,
  getActiveForecastZones,
  getAvalancheCenterMetadata,
} from '@/services/nac/nac'
import {
  applyWeatherArchiveFilters,
  buildWeatherArchiveRows,
  type WeatherArchiveRow,
} from '@/services/nac/weatherArchive'

import { ArchiveActiveFilters } from './ArchiveActiveFilters.client'
import { ArchiveFilters, type ArchiveFiltersProps } from './ArchiveFilters'
import { ArchiveMobileFilters } from './ArchiveMobileFilters.client'
import { ArchivePagination } from './ArchivePagination'
import { ArchiveProductRow } from './ArchiveProductRow'
import { ArchiveTabs } from './ArchiveTabs'
import { DangerCountBar } from './DangerCountBar'
import { DangerOverTimeCharts } from './DangerOverTimeCharts.client'
import { WeatherArchiveProductRow } from './WeatherArchiveProductRow'

interface ForecastArchiveBrowserProps {
  centerSlug: string
  query: ArchiveQuery
  view: ArchiveView
  /** Whether the Mountain Weather tab is offered. */
  showWeather: boolean
}

export async function ForecastArchiveBrowser({
  centerSlug,
  query,
  view,
  showWeather,
}: ForecastArchiveBrowserProps) {
  const { zones, metadata, startSeason, filters } = await resolveArchive(centerSlug, query)

  // The whole season is one cache entry shared by every reader; the range narrows it in-process.
  const archive = await loadArchive(centerSlug, view, filters, zones, metadata.timezone)

  const filterProps = archiveFilterProps(zones, filters, startSeason, view)
  const shown = shownFilters(view, filters, zones)

  return (
    <ArchiveLayout
      tabs={<ArchiveTabs active={view} query={query} showWeather={showWeather} />}
      sidebar={<ArchiveFilters {...filterProps} />}
    >
      <div className="md:hidden">
        <ArchiveMobileFilters
          {...filterProps}
          total={archive?.rows.length ?? 0}
          hasActiveFilters={shown.isFiltered}
        />
      </div>
      <ArchiveActiveFilters
        from={filters.from}
        to={filters.to}
        isDateFiltered={filters.isDateFiltered}
        {...shown}
      />
      <ArchiveContent view={view} archive={archive} query={query} filters={filters} zones={zones} />
      <ForecastDisclaimer centerType={metadata.type} centerName={metadata.name} />
    </ArchiveLayout>
  )
}

/** The page shell: heading, tabs, the content column, and the filter sidebar from `md` up. */
function ArchiveLayout({
  tabs,
  sidebar,
  children,
}: {
  tabs: React.ReactNode
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Forecast Archive</h1>
      <div className="mt-4">{tabs}</div>
      <div className="mt-6 flex flex-col gap-8 md:flex-row md:gap-16">
        <div className="min-w-0 grow space-y-4">{children}</div>
        <aside className="hidden shrink-0 md:flex md:w-[240px] md:flex-col lg:w-[300px]">
          {sidebar}
        </aside>
      </div>
    </div>
  )
}

/** What the filter controls need to show the resolved state and offer the alternatives. */
function archiveFilterProps(
  zones: ArchiveZone[],
  filters: ResolvedArchiveFilters,
  startSeason: number,
  view: ArchiveView,
): ArchiveFiltersProps {
  return {
    zones: zones.map(({ slug, name }) => ({ slug, name })),
    dateOnly: view === 'weather',
    seasons: seasonOptions(filters.currentSeason, startSeason),
    season: filters.season,
    currentSeason: filters.currentSeason,
    window: filters.window,
    from: filters.from,
    to: filters.to,
    defaultRange: filters.defaultRange,
  }
}

/**
 * The filter chips the tab shows and whether it counts as filtered. The weather tab applies only
 * the season and range, so the zone, danger and type selections it carries across from the other
 * tabs are not shown there, as in the legacy widget — nor counted, where the legacy widget offered
 * "Clear filters" for selections the tab neither showed nor applied.
 */
function shownFilters(view: ArchiveView, filters: ResolvedArchiveFilters, zones: ArchiveZone[]) {
  if (view === 'weather') {
    return {
      zones: [],
      dangers: [],
      types: [],
      isFiltered: filters.season !== filters.currentSeason || filters.isDateFiltered,
    }
  }

  return {
    zones: zones.filter((zone) => filters.zone.includes(zone.slug)),
    dangers: filters.danger,
    types: filters.type,
    isFiltered: filters.isFiltered,
  }
}

/** The center's zones and metadata, and the filters the URL resolves to against them. */
async function resolveArchive(centerSlug: string, query: ArchiveQuery) {
  const [activeZones, metadata] = await Promise.all([
    getActiveForecastZones(centerSlug),
    getAvalancheCenterMetadata(centerSlug),
  ])
  const zones: ArchiveZone[] = activeZones.map(({ slug, zone }) => ({
    id: zone.id,
    slug,
    name: zone.name,
  }))

  // The center's clock decides the season boundary and the default end of the range.
  const startSeason = metadata.widget_config.forecast?.start_year ?? DEFAULT_ARCHIVE_START_SEASON
  const filters = resolveArchiveFilters(query, {
    today: todayInTimezone(metadata.timezone),
    startSeason,
    zoneSlugs: zones.map((zone) => zone.slug),
  })

  return { zones, metadata, startSeason, filters }
}

/** The forecast tabs' season rows and the subset the filters select, or the weather tab's rows. */
type LoadedArchive =
  | { kind: 'forecasts'; seasonRows: ArchiveRow[]; rows: ArchiveRow[] }
  | { kind: 'weather'; rows: WeatherArchiveRow[] }

/**
 * The tab's rows, or `null` when the archive could not be fetched. Null rather than an empty
 * list because those must render differently: "no products match" is an answer, "the archive is
 * down" is not, and a life-safety archive that shows the first for the second would be failing
 * silently.
 */
async function loadArchive(
  centerSlug: string,
  view: ArchiveView,
  filters: ResolvedArchiveFilters,
  zones: ArchiveZone[],
  timezone: string | null | undefined,
): Promise<LoadedArchive | null> {
  try {
    const archive = await fetchProductArchiveOrThrow(centerSlug, filters.window)
    return buildLoadedArchive(archive, view, filters, zones, timezone)
  } catch {
    return null
  }
}

function buildLoadedArchive(
  archive: ArchiveProductSummary[],
  view: ArchiveView,
  filters: ResolvedArchiveFilters,
  zones: ArchiveZone[],
  timezone: string | null | undefined,
): LoadedArchive {
  if (view === 'weather') {
    const rows = buildWeatherArchiveRows(archive, timezone)
    return { kind: 'weather', rows: applyWeatherArchiveFilters(rows, filters) }
  }

  const seasonRows = buildArchiveRows(archive, zones, timezone)
  return { kind: 'forecasts', seasonRows, rows: applyArchiveFilters(seasonRows, filters) }
}

/**
 * The tab's content, or the reason there is none — a failed fetch and an empty match look
 * different.
 */
function ArchiveContent({
  view,
  archive,
  query,
  filters,
  zones,
}: {
  view: ArchiveView
  archive: LoadedArchive | null
  query: ArchiveQuery
  filters: ResolvedArchiveFilters
  zones: ArchiveZone[]
}) {
  if (archive === null) return <ArchiveUnavailable />
  if (archive.rows.length === 0) return <NoProductsFound />
  if (archive.kind === 'weather') {
    return <WeatherArchiveList rows={archive.rows} query={query} page={filters.page} />
  }
  return (
    <ForecastTabContent
      view={view}
      archive={archive}
      query={query}
      filters={filters}
      zones={zones}
    />
  )
}

/** The forecast rows as the tab shows them: the list, or the danger-over-time charts. */
function ForecastTabContent({
  view,
  archive,
  query,
  filters,
  zones,
}: {
  view: ArchiveView
  archive: { seasonRows: ArchiveRow[]; rows: ArchiveRow[] }
  query: ArchiveQuery
  filters: ResolvedArchiveFilters
  zones: ArchiveZone[]
}) {
  if (view === 'danger') return <DangerCharts archive={archive} range={filters} zones={zones} />
  return <ArchiveList rows={archive.rows} query={query} page={filters.page} />
}

/** The count and one page of weather rows. Weather carries no rating, so there is no tally. */
function WeatherArchiveList({
  rows,
  query,
  page,
}: {
  rows: WeatherArchiveRow[]
  query: ArchiveQuery
  page: number
}) {
  const shown = paginateArchiveRows(rows, page)

  return (
    <>
      <ProductCount total={shown.total} />

      <ul className="list-none space-y-2 p-0" aria-label="Archived mountain weather">
        {shown.rows.map((row) => (
          <WeatherArchiveProductRow key={row.productId} row={row} />
        ))}
      </ul>

      <ArchivePagination
        basePath={ARCHIVE_WEATHER_PATH}
        query={query}
        page={shown.page}
        pageCount={shown.pageCount}
      />
    </>
  )
}

/** "N Products", the legacy heading over either list. */
function ProductCount({ total }: { total: number }) {
  return (
    <h2 className="text-lg font-semibold">
      {total} {total === 1 ? 'Product' : 'Products'}
    </h2>
  )
}

/** The count, the danger tally and one page of rows. */
function ArchiveList({
  rows,
  query,
  page,
}: {
  rows: ArchiveRow[]
  query: ArchiveQuery
  page: number
}) {
  const shown = paginateArchiveRows(rows, page)

  return (
    <>
      <ProductCount total={shown.total} />

      <ForecastErrorBoundary fallbackMessage="Unable to display the danger summary">
        <DangerCountBar counts={dangerCounts(rows)} />
      </ForecastErrorBoundary>

      <ul className="list-none space-y-2 p-0" aria-label="Archived products">
        {shown.rows.map((row) => (
          <ArchiveProductRow key={`${row.zoneId}-${row.date}`} row={row} />
        ))}
      </ul>

      <ArchivePagination
        basePath={ARCHIVE_PATH}
        query={query}
        page={shown.page}
        pageCount={shown.pageCount}
      />
    </>
  )
}

/**
 * The danger-over-time charts, or the reason there are none. The legacy tab shows nothing at all
 * when the filtered products are all unrated; here that says so, since a blank tab and a broken
 * one look the same.
 */
function DangerCharts({
  archive,
  range,
  zones,
}: {
  archive: { seasonRows: ArchiveRow[]; rows: ArchiveRow[] }
  range: { from: string; to: string }
  zones: ArchiveZone[]
}) {
  const data = buildDangerOverTime(archive.seasonRows, archive.rows, range, zones)
  if (data === null) {
    return (
      <NoProductsFound
        message="No danger ratings to chart"
        hint="The products in this range carry no danger rating"
      />
    )
  }

  return (
    <ForecastErrorBoundary fallbackMessage="Unable to display the danger-over-time charts">
      <DangerOverTimeCharts data={data} />
    </ForecastErrorBoundary>
  )
}

/** The legacy widget's empty state, verbatim by default. */
function NoProductsFound({
  message = 'No products found',
  hint = 'Try adjusting the filter criteria',
}: {
  message?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Search className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <p className="text-lg font-semibold">{message}</p>
      <p className="text-muted-foreground">{hint}</p>
    </div>
  )
}

/** Shown when the archive fetch failed — visibly, never as an empty list. */
function ArchiveUnavailable() {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm"
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <span>Unable to load the forecast archive. Please try again later.</span>
    </div>
  )
}
