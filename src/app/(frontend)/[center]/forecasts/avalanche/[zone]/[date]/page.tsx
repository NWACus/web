import type { Metadata } from 'next/types'

import { NativeForecastView } from '@/components/forecast/NativeForecastView'
import {
  buildZoneArchiveDates,
  findProductIdForDate,
  initialArchiveWindow,
  validDateForProduct,
} from '@/services/nac/archiveDates'
import type { ForecastResult } from '@/services/nac/model/forecast'
import {
  fetchProductArchive,
  fetchProductById,
  getAvalancheCenterMetadata,
  getAvalancheCenterPlatforms,
} from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource, getWeatherSource } from '@/services/nac/sources'
import { zoneSlugFromParam } from '@/services/nac/zoneSlug'
import { formatZoneName } from '@/utilities/formatZoneName'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { format, parseISO } from 'date-fns'
import { notFound } from 'next/navigation'

// Historical products are immutable: render on demand and cache for a long time. This route
// deliberately does NOT run the live revalidate-on-view freshness path — only the current
// forecast page needs that. The long revalidate is a backstop, not a staleness check.
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
 * The archived forecast references the mountain-weather product that was current when it was
 * issued; fetch that (immutable, by id) so historical views show the matching weather.
 */
async function fetchArchivedWeather(center: string, forecastResult: ForecastResult) {
  const weatherProductId = forecastResult.weather_data?.weather_product_id ?? null
  if (weatherProductId === null) return null

  return getWeatherSource(center).getWeather(weatherProductId)
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

export default async function Page({ params }: Args) {
  const { center, zone: zoneParam, date } = await params
  const zone = zoneSlugFromParam(zoneParam)

  await assertDatedForecastAvailable(center, date)

  const [resolvedZone, metadata] = await Promise.all([
    resolveZoneFromSlug(center, zone),
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
    notFound()
  }

  // The current/live product is fetched only to anchor the picker's "return to current" path.
  const [forecastResult, currentProduct] = await Promise.all([
    fetchProductById(productId),
    getForecastSource(center).getForecast(center, resolvedZone.zone.id),
  ])

  if (!forecastResult) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        Unable to load this forecast. Please try again later.
      </div>
    )
  }

  const currentDate = liveProductDate(currentProduct, metadata.timezone)
  const weather = await fetchArchivedWeather(center, forecastResult)

  return (
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
      centerType={metadata.type}
      weather={weather}
    />
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { zone: zoneParam, date } = await params
  const zone = zoneSlugFromParam(zoneParam)

  const zoneName = formatZoneName(zone)
  const dateLabel = DATE_PATTERN.test(date) ? format(parseISO(date), 'MMMM d, yyyy') : date
  const title = `${zoneName} - Avalanche Forecast for ${dateLabel}`

  return {
    title,
    alternates: {
      canonical: `/forecasts/avalanche/${zone}/${date}`,
    },
    // Thousands of immutable archive pages shouldn't compete with the live page in search.
    robots: { index: false, follow: true },
  }
}
