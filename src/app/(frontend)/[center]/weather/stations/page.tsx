import type { Metadata, ResolvedMetadata } from 'next/types'

import {
  NWAC_STATION_REGIONS,
  NWAC_WEATHER_STATION_GROUPS,
  STATIONS_TENANT_SLUG,
  type WeatherStationGroup,
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

function StationLink({ group }: { group: WeatherStationGroup }) {
  return (
    <li>
      <Link href={`/weather/stations/${group.slug}`} className="text-primary hover:underline">
        {group.displayName}
      </Link>
      {/* Listed so legacy links still reach the downloads. */}
      {group.archived && <span className="ml-1 text-xs text-muted-foreground">Archived</span>}
    </li>
  )
}

function ZoneColumns() {
  return (
    <div className="columns-1 gap-8 sm:columns-2 lg:columns-3">
      {NWAC_STATION_REGIONS.map((region) => {
        const groups = NWAC_WEATHER_STATION_GROUPS.filter((group) => group.region === region)
        if (groups.length === 0) return null
        return (
          <section key={region} className="mb-6 break-inside-avoid">
            <h3 className="mb-1 font-semibold">{region}</h3>
            <ul className="leading-snug">
              {groups.map((group) => (
                <StationLink key={group.slug} group={group} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function AllStationsLinks() {
  return (
    <ul className="leading-snug">
      <li>
        <Link
          href="/weather/stations/accumulated-precipitation"
          className="text-primary hover:underline"
        >
          Accumulated Precipitation
        </Link>
        <span className="text-muted-foreground"> — every station side by side</span>
      </li>
      <li>
        <Link href="/weather/stations/map" className="text-primary hover:underline">
          Weather Station Map
        </Link>
        <span className="text-muted-foreground"> — find a station by location</span>
      </li>
    </ul>
  )
}

const sectionHeadingClass = 'border-b pb-1 text-xl font-bold'

export default async function Page({ params }: Args) {
  const { center } = await params

  if (center !== STATIONS_TENANT_SLUG) {
    notFound()
  }

  return (
    <div className="mb-10 flex flex-col gap-8">
      {/* No station picker here — the zone lists below already name every station. */}
      <div className="container">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="font-bold">Weather Stations</h1>
          <p>
            Hourly readings from NWAC&apos;s weather stations. Each station has a table of recent
            observations, graphs back to the start of the season, and CSV downloads.
          </p>
        </div>
      </div>

      <section className="container flex flex-col gap-2">
        <h2 className={sectionHeadingClass}>All stations</h2>
        <AllStationsLinks />
      </section>

      <section className="container flex flex-col gap-3">
        <h2 className={sectionHeadingClass}>By zone</h2>
        <ZoneColumns />
      </section>
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
