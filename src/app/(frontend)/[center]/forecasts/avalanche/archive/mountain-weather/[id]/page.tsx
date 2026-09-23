import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next/types'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { ForecastWidget } from '@/components/NACWidget/ForecastWidget'
import { NativeWeatherView } from '@/components/forecast/NativeWeatherView'
import { getWeatherArchiveAccess } from '@/components/forecast/archive/weatherArchiveAccess'
import { publishedDateForProduct } from '@/services/nac/archiveDates'
import { ARCHIVE_CRUMB, ARCHIVE_PATH, ARCHIVE_WEATHER_PATH } from '@/services/nac/forecastArchive'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { getWeatherSource } from '@/services/nac/sources'

/**
 * Per request rather than ISR, unlike the dated forecast route: a product is addressed by id here,
 * not found through the archive list first, so a failed fetch and an unknown id both come back as
 * null — and a failure must not be held for a month.
 */
export const dynamic = 'force-dynamic'

// Matches a product id: digits only.
const ID_PATTERN = /^\d+$/

const TITLE = 'Mountain Weather'

/** The product id the segment names, or null when it is not one. */
function productIdFromParam(param: string): number | null {
  if (!ID_PATTERN.test(param)) return null
  const id = Number(param)
  // Beyond a safe integer the number no longer names the product the address does.
  return Number.isSafeInteger(id) ? id : null
}

type PathArgs = {
  center: string
  id: string
}

type Args = {
  params: Promise<PathArgs>
}

export default async function Page({ params }: Args) {
  const { center, id } = await params
  const productId = productIdFromParam(id)
  if (productId === null) notFound()

  const access = await getWeatherArchiveAccess(center)
  if (!access.available) notFound()

  const path = `${ARCHIVE_WEATHER_PATH}/${id}`

  if (!access.native) {
    return (
      <ForecastWidget center={center} initialPath={`/weather/${id}`} widgetPageKey="forecast-zone">
        <ArchivedWeatherBreadcrumbs center={center} path={path} title={TITLE} />
      </ForecastWidget>
    )
  }

  return <ArchivedWeather center={center} id={productId} path={path} />
}

/** The product itself, natively, or the reason it cannot be shown. */
async function ArchivedWeather({ center, id, path }: { center: string; id: number; path: string }) {
  const [weather, metadata] = await Promise.all([
    getWeatherSource(center).getWeather(id),
    getAvalancheCenterMetadata(center),
  ])

  if (!weather) {
    return (
      <>
        <ArchivedWeatherBreadcrumbs center={center} path={path} title={TITLE} />
        <UnavailableProduct />
      </>
    )
  }

  // An id is global across centers; another center's product has no page under this one.
  if (weather.avalanche_center.id !== metadata.id) notFound()

  const issued = publishedDateForProduct(weather.published_time, metadata.timezone)

  return (
    <>
      <ArchivedWeatherBreadcrumbs
        center={center}
        path={path}
        // The raw id would be meaningless as the leaf; the day it was issued is what a reader knows.
        title={issued ? format(parseISO(issued), 'MMMM d, yyyy') : TITLE}
      />
      <NativeWeatherView
        weather={weather}
        zones={metadata.zones}
        timezone={metadata.timezone}
        centerType={metadata.type}
        archived
      />
    </>
  )
}

/**
 * An unknown id and a failed fetch both arrive as null, so the copy covers both, and the link gives
 * a reader who followed a stale address somewhere to go.
 */
function UnavailableProduct() {
  return (
    <div role="alert" className="container space-y-4 py-8 text-center text-muted-foreground">
      <p>This Mountain Weather product could not be found, or could not be loaded right now.</p>
      <p>
        <Link href={ARCHIVE_WEATHER_PATH} className="underline">
          Browse all archived Mountain Weather
        </Link>
        .
      </p>
    </div>
  )
}

function ArchivedWeatherBreadcrumbs({
  center,
  path,
  title,
}: {
  center: string
  path: string
  title: string
}) {
  return (
    <Breadcrumbs
      center={center}
      path={path}
      title={title}
      labels={{ [ARCHIVE_PATH]: ARCHIVE_CRUMB, [ARCHIVE_WEATHER_PATH]: TITLE }}
    />
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { id } = await params

  return {
    title: `Archived ${TITLE}`,
    alternates: {
      canonical: `${ARCHIVE_WEATHER_PATH}/${id}`,
    },
    // Thousands of archived products shouldn't compete with the live page in search.
    robots: { index: false, follow: true },
  }
}
