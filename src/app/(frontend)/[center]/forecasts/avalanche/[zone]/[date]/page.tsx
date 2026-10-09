import type { Metadata, ResolvedMetadata } from 'next/types'

import { ogImageUrlForDatedZone } from '@/app/api/[center]/og/buildOgImageUrl'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CurrentForecastRedirect } from '@/components/forecast/CurrentForecastRedirect.client'
import { NativeForecastView } from '@/components/forecast/NativeForecastView'
import { ForecastGlossary } from '@/components/glossary/ForecastGlossary'
import {
  findCoveringDateBeforeWindow,
  isWithinCalendar,
  latestValidDate,
} from '@/services/nac/adjacentForecast'
import {
  buildZoneArchiveDates,
  findCoveringProductDate,
  findProductIdForDate,
  forecastPickerSettings,
  initialArchiveWindow,
  validDateForProduct,
  type ZoneArchiveDate,
} from '@/services/nac/archiveDates'
import {
  currentForecastDateEndpoint,
  mayBeCurrentProductDate,
} from '@/services/nac/currentForecastDate'
import { elevationBandsUrl } from '@/services/nac/dangerScale'
import { findDatedForecast } from '@/services/nac/datedForecast'
import {
  fetchProductArchive,
  fetchProductArchiveOrThrow,
  fetchProductById,
  getAvalancheCenterMetadata,
  getAvalancheCenterPlatforms,
} from '@/services/nac/nac'
import { resolveDatedZoneFromSlug, type DatedForecastZone } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
import { getWeatherForForecast } from '@/services/nac/weatherForForecast'
import { zoneSlugFromParam } from '@/services/nac/zoneSlug'
import { formatZoneName } from '@/utilities/formatZoneName'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { htmlToDescription } from '@/utilities/htmlToDescription'
import { format, parseISO } from 'date-fns'
import { notFound, redirect } from 'next/navigation'

// Historical products are immutable: render on demand and cache for a long time. This route
// deliberately does NOT run the live revalidate-on-view freshness path — only the current
// forecast page needs that. The long revalidate is a backstop, not a staleness check. Which date
// is the live product's is decided on view instead (`CurrentForecastRedirect`), never cached here.
export const revalidate = 2592000 // 30 days
export const dynamicParams = true

// Matches a YYYY-MM-DD valid date.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
  zone: string
  date: string
}

/**
 * 404 unless this is a well-formed date on a center that publishes forecasts natively — the dated
 * history view is native-only, since the legacy widget keeps its own archive.
 */
async function assertDatedForecastAvailable(center: string, date: string) {
  if (!DATE_PATTERN.test(date)) {
    notFound()
  }

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)
  if (!avalancheCenterPlatforms.forecasts) {
    notFound()
  }

  const useNative = await getNativeProductFlag(center, 'forecast')
  if (!useNative) {
    notFound()
  }
}

/**
 * The valid date of the current/live product, which anchors the picker's "return to current" path.
 * Null when the center has no live product at all.
 */
function liveProductDate(
  currentProduct: { published_time: string } | null,
  timezone: string | null | undefined,
) {
  if (!currentProduct) return null

  return validDateForProduct(currentProduct.published_time, timezone)
}

/**
 * The zone's live product, fetched only to anchor the picker's way back to the live page. A
 * retired zone has neither, so its picker and notices keep to dated addresses.
 */
async function liveProductFor(center: string, zone: DatedForecastZone) {
  if (!zone.active) return null

  return getForecastSource(center).getForecast(center, zone.zone.id)
}

interface CoveringSearch {
  center: string
  zone: DatedForecastZone
  /** The page's loaded window and its zone dates, newest first. */
  window: { from: string; to: string }
  archiveDates: ZoneArchiveDate[]
  date: string
  timezone: string
  calendarStart: string
}

/**
 * The covering product when the window loaded nothing before `date`: the nearest older product
 * past it, if still valid. Only inside the picker's calendar, which bounds the month walk.
 */
async function coveringDateBeforeWindow(search: CoveringSearch): Promise<string | null> {
  const { center, zone, window, date, timezone, calendarStart } = search
  if (!isWithinCalendar(date, calendarStart, latestValidDate())) return null

  return findCoveringDateBeforeWindow({
    date,
    windowStart: window.from,
    calendarStart,
    timezone,
    fetchEntries: async (month) =>
      buildZoneArchiveDates(
        await fetchProductArchiveOrThrow(center, month),
        zone.zone.id,
        timezone,
      ),
  })
}

/**
 * A day with no product of its own opens the product that covers it — a multi-day summary still
 * valid that morning — at that product's own dated address, which hands over to the live page in
 * turn when it is the live one. A temporary redirect: a later product for this day would replace
 * it. Otherwise the address 404s.
 */
async function redirectToCoveringProduct(search: CoveringSearch, zoneSlug: string): Promise<never> {
  const { archiveDates, date, timezone } = search
  const loadedEarlier = archiveDates.some((entry) => entry.date < date)
  const covering = loadedEarlier
    ? findCoveringProductDate(archiveDates, date, timezone)
    : await coveringDateBeforeWindow(search)

  if (covering && covering !== date) redirect(`/forecasts/avalanche/${zoneSlug}/${covering}`)
  notFound()
}

/** A retired zone has no live page for its breadcrumb to link to. */
function zonePathsWithoutPages(zone: DatedForecastZone): string[] {
  return zone.active ? [] : [`/forecasts/avalanche/${zone.slug}`]
}

export default async function Page({ params }: Args) {
  const { center, zone: zoneParam, date } = await params
  const zone = zoneSlugFromParam(zoneParam)

  await assertDatedForecastAvailable(center, date)

  const [resolvedZone, metadata] = await Promise.all([
    resolveDatedZoneFromSlug(center, zone),
    getAvalancheCenterMetadata(center),
  ])

  if (!resolvedZone) {
    notFound()
  }

  // The picker window is anchored on the viewed date; older months lazy-load client-side.
  const window = initialArchiveWindow(date)
  const archive = await fetchProductArchive(center, window)
  const initialDates = buildZoneArchiveDates(archive, resolvedZone.zone.id, metadata.timezone)
  const productId = findProductIdForDate(initialDates, date)

  if (productId === null) {
    return redirectToCoveringProduct(
      {
        center,
        zone: resolvedZone,
        window,
        archiveDates: initialDates,
        date,
        timezone: metadata.timezone,
        calendarStart: forecastPickerSettings(metadata).calendarStart,
      },
      zone,
    )
  }

  const [forecastResult, currentProduct] = await Promise.all([
    fetchProductById(productId),
    liveProductFor(center, resolvedZone),
  ])

  if (!forecastResult) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        Unable to load this forecast. Please try again later.
      </div>
    )
  }

  const currentDate = liveProductDate(currentProduct, metadata.timezone)
  // The weather that was current when this forecast was issued — by the id it points at, or for
  // the pointerless SNFAC archive, by its published day.
  const weather = await getWeatherForForecast(
    center,
    resolvedZone.zone.id,
    forecastResult,
    metadata.timezone,
  )

  return (
    <>
      <Breadcrumbs
        center={center}
        path={`/forecasts/avalanche/${zone}/${date}`}
        // The raw date segment would render as "2026 09 14".
        title={format(parseISO(date), 'MMMM d, yyyy')}
        // The zone's real name, not the slug: a derived crumb is lowercase in the DOM and only
        // looks capitalized through CSS, so assistive tech reads it as the reader never sees it.
        labels={{ [`/forecasts/avalanche/${zone}`]: resolvedZone.zone.name }}
        pathsWithoutPages={zonePathsWithoutPages(resolvedZone)}
      />
      <ForecastGlossary center={metadata}>
        <NativeForecastView
          center={center}
          zone={resolvedZone}
          timezone={metadata.timezone}
          forecastResult={forecastResult}
          // Historical view: the warning banner reflects current alerts, not point-in-time ones.
          warning={null}
          initialDates={initialDates}
          initialRange={window}
          currentDate={currentDate}
          selectedDate={date}
          basePath={`/forecasts/avalanche/${zone}`}
          pickerSettings={forecastPickerSettings(metadata)}
          centerDetails={{ type: metadata.type, elevationBandsUrl: elevationBandsUrl(metadata) }}
          weather={weather}
        />
      </ForecastGlossary>
      {/* The live product's own date opens the live page — decided on view, not cached here. */}
      <CurrentForecastRedirect
        enabled={mayBeCurrentProductDate(date, currentDate, resolvedZone.active)}
        endpoint={currentForecastDateEndpoint(center, zone)}
        date={date}
        liveHref={`/forecasts/avalanche/${zone}`}
      />
    </>
  )
}

/** The archived product's bottom line as plain text, or undefined where there's no product. */
async function datedPreviewDescription(
  center: string,
  zone: string,
  date: string,
): Promise<string | undefined> {
  if (!DATE_PATTERN.test(date) || !(await getNativeProductFlag(center, 'forecast'))) {
    return undefined
  }

  // A description is optional; failing to find one must not fail the page.
  const forecast = await findDatedForecast(center, zone, date).catch(() => null)
  return htmlToDescription(forecast?.bottom_line)
}

export async function generateMetadata(
  { params }: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center, zone: zoneParam, date } = await params
  const zone = zoneSlugFromParam(zoneParam)

  const zoneName = formatZoneName(zone)
  const dateLabel = DATE_PATTERN.test(date) ? format(parseISO(date), 'MMMM d, yyyy') : date
  // `<title>` and `og:title` alike: a shared archived forecast must not read as today's.
  const title = `${zoneName} - Archived Avalanche Forecast for ${dateLabel}`
  const url = `/forecasts/avalanche/${zone}/${date}`

  const [parentMeta, description] = await Promise.all([
    parent,
    datedPreviewDescription(center, zone, date),
  ])

  return {
    title,
    ...(description ? { description } : {}),
    alternates: {
      canonical: url,
    },
    // Previews as this dated page, not the site root, with the zone card for this day's danger.
    // The OG route validates the date and draws the center card if it can't use it.
    openGraph: {
      ...parentMeta.openGraph,
      title,
      url,
      ...(description ? { description } : {}),
      images: [{ url: ogImageUrlForDatedZone(center, zone, date), width: 1200, height: 630 }],
    },
    // Thousands of immutable archive pages shouldn't compete with the live page in search.
    robots: { index: false, follow: true },
  }
}
