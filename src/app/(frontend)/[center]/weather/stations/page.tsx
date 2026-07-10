import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationPicker } from '@/components/WeatherStations/StationPicker'
import {
  STATION_REGIONS,
  STATIONS_TENANT_SLUG,
  WEATHER_STATION_GROUPS,
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
      <div className="container flex justify-between gap-3 pb-4">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="font-bold">Weather Stations</h1>
        </div>
        <StationPicker />
      </div>

      <div className="container grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
        {STATION_REGIONS.map((region) => {
          const groups = WEATHER_STATION_GROUPS.filter((group) => group.region === region)
          if (groups.length === 0) return null
          return (
            <section key={region} className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">{region}</h2>
              <ul className="">
                {groups.map((group) => (
                  <li key={group.slug}>
                    <Link
                      href={`/weather/stations/${group.slug}`}
                      className="text-primary hover:underline"
                    >
                      {group.displayName}
                    </Link>
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
