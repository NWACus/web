import type { Metadata } from 'next/types'

import { NativeForecastView } from '@/components/forecast/NativeForecastView'
import {
  buildZoneArchiveDates,
  findProductIdForDate,
  initialArchiveWindow,
  validDateForProduct,
} from '@/services/nac/archiveDates'
import {
  fetchForecast,
  fetchProductArchive,
  fetchProductById,
  getAvalancheCenterMetadata,
  getAvalancheCenterPlatforms,
} from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { formatZoneName } from '@/utilities/formatZoneName'
import { getUseNativeForecasts } from '@/utilities/getUseNativeForecasts'
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

export default async function Page({ params }: Args) {
  const { center, zone, date } = await params

  if (!DATE_PATTERN.test(date)) {
    notFound()
  }

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)
  if (!avalancheCenterPlatforms.forecasts) {
    notFound()
  }

  // The dated history view is native-only; the legacy widget keeps its own archive.
  const useNative = await getUseNativeForecasts(center)
  if (!useNative) {
    notFound()
  }

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
    fetchForecast(center, resolvedZone.zone.id),
  ])

  if (!forecastResult) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        Unable to load this forecast. Please try again later.
      </div>
    )
  }

  const currentDate = currentProduct
    ? validDateForProduct(currentProduct.published_time, metadata.timezone)
    : null

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
    />
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { zone, date } = await params

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
