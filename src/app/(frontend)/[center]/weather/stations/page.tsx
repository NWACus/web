import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationPicker } from '@/components/WeatherStations/StationPicker'
import {
  NWAC_STATION_REGIONS,
  NWAC_WEATHER_STATION_GROUPS,
  STATIONS_TENANT_SLUG,
} from '@/constants/weatherStations'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

type Args = {
  params: Promise<{ center: string }>
}

export async function generateStaticParams() {
  return [{ center: STATIONS_TENANT_SLUG }]
}

export default async function Page({ params }: Args) {
  const { center } = await params

  if (center !== STATIONS_TENANT_SLUG) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 mb-10">
      <div className="container flex flex-wrap items-start justify-between gap-3 pb-4">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="font-bold">Weather Stations</h1>
        </div>
        <div className="flex flex-col items-end">
          <StationPicker />
        </div>
      </div>

      {/* Capped at three columns and tightened per Dennis's feedback (#1195) —
          the four-column flow left the regions floating in whitespace. */}
      <div className="container columns-1 gap-8 sm:columns-2 lg:columns-3">
        {NWAC_STATION_REGIONS.map((region) => {
          const groups = NWAC_WEATHER_STATION_GROUPS.filter((group) => group.region === region)
          if (groups.length === 0) return null
          return (
            <section key={region} className="mb-6 break-inside-avoid">
              <h2 className="mb-1 text-lg font-semibold">{region}</h2>
              <ul className="leading-snug">
                {groups.map((group) => (
                  <li key={group.slug}>
                    <Link
                      href={`/weather/stations/${group.slug}`}
                      className="text-primary hover:underline"
                    >
                      {group.displayName}
                    </Link>
                    {/* Listed so legacy links and browsing still reach the
                        downloads; how archived stations should surface across
                        the site is still open (#1195). */}
                    {group.archived && (
                      <span className="ml-1 text-xs text-muted-foreground">Archived</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
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
      canonical: '/weather/stations',
    },
    openGraph: {
      ...parentOg,
      title: `Weather Stations | ${parentTitle}`,
      url: '/weather/stations',
      images: [
        { url: `/api/${center}/og?routeTitle=Weather%20Stations`, width: 1200, height: 630 },
      ],
    },
  }
}
