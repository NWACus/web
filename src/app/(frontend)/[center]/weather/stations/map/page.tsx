import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { StationMapLoader } from '@/components/stationMap/StationMapLoader.client'
import { STATIONS_TENANT_SLUG } from '@/constants/weatherStations'
import { getAvalancheCenterMetadata, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { resolveStationMapSettings } from '@/services/snowobs/stationMap/settings'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1000,
    select: {
      slug: true,
    },
  })

  return tenants.docs.map((tenant): PathArgs => ({ center: tenant.slug }))
}

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
}

/**
 * The native map's server half: the center's station-map settings from the NAC dashboard, and
 * whether this center has native station tables for the map's markers and toolbar to link to.
 * The stations themselves are fetched by the map on mount, so the readings are current rather
 * than as old as the static page.
 */
async function NativeStationMap({ center }: { center: string }) {
  const metadata = await getAvalancheCenterMetadata(center)
  const settings = resolveStationMapSettings(metadata.widget_config.stations)
  const hasNativeStationPages = center === STATIONS_TENANT_SLUG

  return (
    <div className="container">
      <StationMapLoader
        centerSlug={center}
        settings={settings}
        tableHref={hasNativeStationPages ? '/weather/stations' : null}
      />
    </div>
  )
}

export default async function Page({ params }: Args) {
  const { center } = await params

  // The AFP's capability gate sits above our rollout flag: no stations, no page, native or not.
  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)
  if (!avalancheCenterPlatforms.stations) {
    notFound()
  }

  const useNative = await getNativeProductFlag(center, 'stationMap')

  return (
    <>
      {!useNative && <WidgetRouterHandler initialPath="/" widgetPageKey="weather-stations" />}
      <div className="flex flex-col gap-4">
        <div className="container mb-4">
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="font-bold">Weather Station Map</h1>
          </div>
        </div>
        {useNative ? (
          <NativeStationMap center={center} />
        ) : (
          <NACWidget center={center} widget={'stations'} />
        )}
      </div>
    </>
  )
}

export async function generateMetadata(
  props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center } = await props.params
  const parentMeta = await parent

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  return {
    title: `Weather Stations | ${parentTitle}`,
    alternates: {
      canonical: '/weather/stations/map',
    },
    openGraph: {
      ...parentOg,
      title: `Weather Stations | ${parentTitle}`,
      url: '/weather/stations/map',
      images: [
        { url: `/api/${center}/og?routeTitle=Weather%20Stations`, width: 1200, height: 630 },
      ],
    },
  }
}
