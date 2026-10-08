import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { ogImageUrlForZone } from '@/app/api/[center]/og/buildOgImageUrl'
import { ForecastWidget } from '@/components/NACWidget/ForecastWidget'
import { NativeForecastPage } from '@/components/forecast/NativeForecastPage'
import { getForecastZoneDanger } from '@/services/nac/dangerMap/mapLayer'
import { zoneOgImageVersion } from '@/services/nac/forecastFingerprint'
import { ProductType, type ForecastResult } from '@/services/nac/model/forecast'
import type { ZoneProperties } from '@/services/nac/model/mapLayer'
import { getActiveForecastZones, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
import { zoneSlugFromParam } from '@/services/nac/zoneSlug'
import { formatZoneName } from '@/utilities/formatZoneName'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { htmlToDescription } from '@/utilities/htmlToDescription'
import { notFound } from 'next/navigation'

// `main`'s 30 min for the widget. A native render reads the forecast through a 300s fetch, which
// lowers this render's window to 5 min; see "Rebuild cadence" in docs/afp-products/architecture.md.
export const revalidate = 1800

/**
 * On-demand for a zone that is not in `generateStaticParams`, which is what the dated route below
 * this one already does.
 *
 * `false` looks like the safer choice — only real zones exist — but it is what made a correction
 * take the page down. `revalidateTag`, which the freshness path calls the moment a forecast
 * changes, is a *hard* cache invalidation: the next read misses entirely rather than going stale
 * (unlike the `revalidate` window above, which serves stale while it regenerates). With no
 * fallback, Next answers that miss by abandoning this route, and `[center]/[...segments]` picks
 * the request up and 404s — for ~70s, on every zone sharing the revalidated forecast or weather
 * tag. Generating on demand is what lets the correction render instead.
 *
 * An unknown zone still 404s; that now comes from the explicit check below rather than from
 * routing.
 */
export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenantsRes = await payload.find({
    collection: 'tenants',
    limit: 1000,
    select: {
      slug: true,
    },
  })

  const params: PathArgs[] = []

  for (const tenant of tenantsRes.docs) {
    const activeForecastZones = await getActiveForecastZones(tenant.slug)

    activeForecastZones.forEach(({ slug: zoneSlug }) =>
      params.push({ center: tenant.slug, zone: zoneSlug }),
    )
  }

  return params
}

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
  zone: string
}

export default async function Page({ params }: Args) {
  const { center, zone: zoneParam } = await params
  const zone = zoneSlugFromParam(zoneParam)

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

  if (!avalancheCenterPlatforms.forecasts) {
    notFound()
  }

  // Routing no longer rejects an unknown zone, so the route does it itself — before the rollout
  // flag is read, so a bad slug 404s the same way whether the center is on native or the widget.
  const resolvedZone = await resolveZoneFromSlug(center, zone)

  if (!resolvedZone) {
    notFound()
  }

  const useNative = await getNativeProductFlag(center, 'forecast')

  if (useNative) {
    return (
      <>
        <Breadcrumbs
          center={center}
          path={`/forecasts/avalanche/${zone}`}
          title={resolvedZone.zone.name}
        />
        <NativeForecastPage centerSlug={center} zoneSlug={zone} />
      </>
    )
  }

  return (
    <ForecastWidget center={center} initialPath={`/${zone}/`} widgetPageKey="forecast-zone">
      <Breadcrumbs
        center={center}
        path={`/forecasts/avalanche/${zone}`}
        title={resolvedZone.zone.name}
      />
    </ForecastWidget>
  )
}

/**
 * The native forecast the page renders, or `undefined` on a widget center, which never reads one.
 * The same cached read the page makes, so metadata costs no extra upstream request.
 */
async function readNativeForecast(
  center: string,
  zone: string,
): Promise<ForecastResult | null | undefined> {
  if (!(await getNativeProductFlag(center, 'forecast'))) return undefined

  const resolved = await resolveZoneFromSlug(center, zone)
  if (!resolved) return undefined

  return getForecastSource(center).getForecast(center, resolved.zone.id)
}

/**
 * The forecaster's bottom line when the page renders a native forecast, otherwise the map-layer
 * travel advice, as plain text.
 */
function previewDescription(
  danger: ZoneProperties | null,
  forecast: ForecastResult | null | undefined,
): string | undefined {
  const bottomLine =
    forecast?.product_type === ProductType.Forecast
      ? htmlToDescription(forecast.bottom_line)
      : undefined
  return bottomLine ?? htmlToDescription(danger?.travel_advice)
}

export async function generateMetadata(
  { params }: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = await parent
  const { center, zone: zoneParam } = await params
  const zone = zoneSlugFromParam(zoneParam)

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  const zoneName = formatZoneName(zone)
  const title = `${zoneName} - Avalanche Forecast | ${parentTitle}`

  const danger = await getForecastZoneDanger(center, zone).catch(() => null)
  const forecast = await readNativeForecast(center, zone)
  const description = previewDescription(danger, forecast)

  return {
    title,
    ...(description ? { description } : {}),
    alternates: {
      canonical: `/forecasts/avalanche/${zone}`,
    },
    openGraph: {
      ...parentOg,
      title,
      url: `/forecasts/avalanche/${zone}`,
      ...(description ? { description } : {}),
      images: [
        {
          // Versioned by the forecast, so a link shared after a change isn't given a cached image
          // of the old rating.
          url: ogImageUrlForZone(center, zone, zoneOgImageVersion(danger, forecast)),
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
