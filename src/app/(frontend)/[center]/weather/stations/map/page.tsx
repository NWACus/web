import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { getStationPages } from '@/services/stations/getStationPages'
import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { StationMapLoader } from '@/components/stationMap/StationMapLoader.client'
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
 * whether this center has native station pages for the toolbar to link to.
 * The stations themselves are fetched by the map on mount, so the readings are current rather
 * than as old as the static page.
 */
async function NativeStationMap({
  center,
  hasStationsIndex,
}: {
  center: string
  hasStationsIndex: boolean
}) {
  const metadata = await getAvalancheCenterMetadata(center)
  const settings = resolveStationMapSettings(metadata.widget_config.stations)

  return (
    <div className="container">
      <StationMapLoader
        centerSlug={center}
        settings={settings}
        tableHref={hasStationsIndex ? '/weather/stations' : null}
      />
    </div>
  )
}

export default async function Page({ params }: Args) {
  const { center } = await params
  const hasStationsIndex = (await getStationPages(center)).length > 0

  // The AFP's capability gate sits above our rollout flag: no stations, no page, native or not.
  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)
  if (!avalancheCenterPlatforms.stations) {
    notFound()
  }

  const useNative = await getNativeProductFlag(center, 'stationMap')

  return (
    <>
      {!useNative && <WidgetRouterHandler initialPath="/" widgetPageKey="weather-stations" />}
      <Breadcrumbs
        center={center}
        path="/weather/stations/map"
        hasStationsIndex={hasStationsIndex}
      />
      <div className="flex flex-col gap-2 sm:gap-4">
        {/* The map is sized against what's left of the viewport, so the title is the one heading
            on the site that gives ground on a phone: a full-size one wraps to two lines and
            pushes the bottom of the forecast area below the fold. */}
        <div className="container sm:mb-4">
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold sm:text-4xl">Weather Station Map</h1>
          </div>
        </div>
        {useNative ? (
          <NativeStationMap center={center} hasStationsIndex={hasStationsIndex} />
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
