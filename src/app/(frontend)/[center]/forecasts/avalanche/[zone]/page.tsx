import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import {
  getActiveForecastZones,
  getAvalancheCenterPlatforms,
  getForecastZoneDanger,
} from '@/services/nac/nac'
import { formatZoneName } from '@/utilities/formatZoneName'
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
    // A NAC API failure for one center must not abort the whole build. Skip this
    // center's zones on error; with dynamicParams = false they 404 until the next
    // successful build rather than rendering on-demand.
    try {
      const activeForecastZones = await getActiveForecastZones(tenant.slug)

      activeForecastZones.forEach(({ slug: zoneSlug }) =>
        params.push({ center: tenant.slug, zone: zoneSlug }),
      )
    } catch (err) {
      payload.logger.error(
        { err, center: tenant.slug },
        `Failed to resolve forecast zones for ${tenant.slug}; skipping its zone params`,
      )
    }
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

  const danger = await getForecastZoneDanger(center, zone).catch(() => null)
  const travelAdvice = danger?.travel_advice ?? null

  const title = `${zoneName} - Avalanche Forecast | ${parentTitle}`

  return {
    title,
    ...(travelAdvice ? { description: travelAdvice } : {}),
    alternates: {
      canonical: `/forecasts/avalanche/${zone}`,
    },
    openGraph: {
      ...parentOg,
      title,
      url: `/forecasts/avalanche/${zone}`,
      ...(travelAdvice ? { description: travelAdvice } : {}),
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
