import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { StationNowTable } from '@/components/WeatherStations/StationNowTable'
import { StationPicker } from '@/components/WeatherStations/StationPicker'
import { Badge } from '@/components/ui/badge'
import { getStationGroup, WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { buildStationTable, fetchStationTimeseries } from '@/services/snowobs'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// ISR: regenerate at most every 10 minutes; SnowObs stations report ~hourly.
export const revalidate = 600

// Flag the latest reading as stale if it is older than this.
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000

// Selectable time windows. The first entry is the default.
const RANGES = [
  { key: '24h', label: 'Last 24 Hours', hours: 24 },
  { key: '7d', label: 'Last 7 Days', hours: 24 * 7 },
] as const

type PathArgs = {
  center: string
  station: string
}

type Args = {
  params: Promise<PathArgs>
  searchParams: Promise<{ range?: string }>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 0,
    select: {
      slug: true,
    },
  })

  const params: PathArgs[] = []
  for (const tenant of tenants.docs) {
    const platforms = await getAvalancheCenterPlatforms(tenant.slug)
    if (!platforms.stations) continue
    for (const group of WEATHER_STATION_GROUPS) {
      params.push({ center: tenant.slug, station: group.slug })
    }
  }
  return params
}

export default async function Page({ params, searchParams }: Args) {
  const { center, station } = await params
  const { range: rangeParam } = await searchParams

  const platforms = await getAvalancheCenterPlatforms(center)
  if (!platforms.stations) {
    notFound()
  }

  const group = getStationGroup(station)
  if (!group) {
    notFound()
  }

  const activeRange = RANGES.find((range) => range.key === rangeParam) ?? RANGES[0]

  const response = await fetchStationTimeseries(group.stids, {
    revalidate,
    windowHours: activeRange.hours,
  })
  const table = buildStationTable(response, group.columns)

  const latest = table.rows[0]
  const isStale =
    table.latestObservation !== null && Date.now() - table.latestObservation > STALE_THRESHOLD_MS

  return (
    <div className="flex flex-col gap-4 mb-10">
      <div className="container flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">{group.region}</p>
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="font-bold">{group.displayName}</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs text-muted-foreground mb-1">
            {latest ? (
              <span>
                Latest observation {latest.display}
                {table.timezoneLabel ? ` ${table.timezoneLabel}` : ''}
              </span>
            ) : (
              <span>No recent observations</span>
            )}
            {isStale && <Badge variant="destructive">Data may be stale</Badge>}
          </div>
          <StationPicker current={group.slug} />
        </div>
      </div>

      <div className="container flex flex-col gap-3">
        <nav className="flex gap-1 border-b" aria-label="Time range">
          {RANGES.map((range) => (
            <Link
              key={range.key}
              href={`?range=${range.key}`}
              aria-current={range.key === activeRange.key ? 'true' : undefined}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
                range.key === activeRange.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {range.label}
            </Link>
          ))}
        </nav>

        <StationNowTable table={table} />
      </div>
    </div>
  )
}

export async function generateMetadata(
  props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center, station } = await props.params
  const parentMeta = await parent
  const group = getStationGroup(station)

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph
  const routeTitle = group ? group.displayName : 'Weather Station'
  const canonical = `/weather/stations/${station}`

  return {
    title: `${routeTitle} | ${parentTitle}`,
    alternates: {
      canonical,
    },
    openGraph: {
      ...parentOg,
      title: `${routeTitle} | ${parentTitle}`,
      url: canonical,
      images: [
        {
          url: `/api/${center}/og?routeTitle=${encodeURIComponent(routeTitle)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
