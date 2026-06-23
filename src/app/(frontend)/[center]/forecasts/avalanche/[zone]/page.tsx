import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { NativeForecastPage } from '@/components/forecast/NativeForecastPage'
import { ProductType } from '@/services/nac/model/forecast'
import {
  getActiveForecastZones,
  getAvalancheCenterPlatforms,
  getForecastZoneDanger,
} from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
import { formatZoneName } from '@/utilities/formatZoneName'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { notFound } from 'next/navigation'

// ISR rather than fully static so the og:description travel advice in shared link previews
// stays current with the daily forecast. The og:image itself is always live (dynamic route).
export const revalidate = 1800
export const dynamicParams = false

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
  const { center, zone } = await params

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

  if (!avalancheCenterPlatforms.forecasts) {
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
  const { center, zone } = await params

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
          url: `/api/${center}/og?route=forecasts/avalanche/${zone}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
