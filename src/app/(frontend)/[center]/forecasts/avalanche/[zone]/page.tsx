import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { NativeForecastPage } from '@/components/forecast/NativeForecastPage'
import { getForecastZoneDanger } from '@/services/nac/dangerMap/mapLayer'
import { ProductType } from '@/services/nac/model/forecast'
import { getActiveForecastZones, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
import { zoneSlugFromParam } from '@/services/nac/zoneSlug'
import { formatZoneName } from '@/utilities/formatZoneName'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { notFound } from 'next/navigation'

// Short ISR backstop (5 min) so a forecast is never frozen at build time and the og:description
// travel advice in shared link previews stays current with the daily forecast. The per-view
// revalidate-on-view path (ForecastFreshness) catches corrections/retractions faster than this.
export const revalidate = 300

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
  if (!(await resolveZoneFromSlug(center, zone))) {
    notFound()
  }

  const useNative = await getNativeProductFlag(center, 'forecast')

  if (useNative) {
    return <NativeForecastPage centerSlug={center} zoneSlug={zone} />
  }

  return (
    <>
      <WidgetRouterHandler initialPath={`/${zone}/`} widgetPageKey="forecast-zone" />
      <div className="container flex flex-col">
        <NACWidget center={center} widget={'forecast'} />
      </div>
    </>
  )
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

  // Description: the forecaster's bottom line when native mode is on (richer), otherwise the
  // map-layer travel advice. The og:image is always the live dynamic OG route.
  const danger = await getForecastZoneDanger(center, zone).catch(() => null)
  let description = danger?.travel_advice ?? undefined

  const useNative = await getNativeProductFlag(center, 'forecast')
  if (useNative) {
    const resolved = await resolveZoneFromSlug(center, zone)
    if (resolved) {
      const forecast = await getForecastSource(center).getForecast(center, resolved.zone.id)
      if (forecast && forecast.product_type === ProductType.Forecast && forecast.bottom_line) {
        description = forecast.bottom_line
      }
    }
  }

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
          // Encoded because the slug carries a literal `&` for zones whose name contains one,
          // which would otherwise end the query parameter early.
          url: `/api/${center}/og?route=${encodeURIComponent(`forecasts/avalanche/${zone}`)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
