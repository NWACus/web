import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { StationPageSummary } from '@/services/stations/getStationPages'
import {
  allStationPageParams,
  getStationPages,
  toPageSummaries,
} from '@/services/stations/getStationPages'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata, ResolvedMetadata } from 'next/types'

export const dynamic = 'force-static'

type Args = {
  params: Promise<{ center: string }>
}

// A center has station pages when the collection has rows for it.
export async function generateStaticParams() {
  const centers = new Set((await allStationPageParams()).map((p) => p.center))
  return Array.from(centers).map((center) => ({ center }))
}

function StationLink({ page }: { page: StationPageSummary }) {
  return (
    <li>
      <Link href={`/weather/stations/${page.slug}`} className="text-primary hover:underline">
        {page.displayName}
      </Link>
      {/* Listed so legacy links still reach the downloads. */}
      {page.archived && <span className="ml-1 text-xs text-muted-foreground">Archived</span>}
    </li>
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

function Intro() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1 className="font-bold">Weather Stations</h1>
      <p>
        Hourly readings from the center&apos;s weather stations. Each station has a table of recent
        observations, graphs back to the start of the season, and CSV downloads.
      </p>
    </div>
  )
}

function StationList({ pages }: { pages: StationPageSummary[] }) {
  return (
    <ul className="columns-1 gap-8 leading-snug sm:columns-2 lg:columns-3">
      {pages.map((page) => (
        <StationLink key={page.slug} page={page} />
      ))}
    </ul>
  )
}

export default async function Page({ params }: Args) {
  const { center } = await params
  const pages = await getStationPages(center)
  if (pages.length === 0) {
    notFound()
  }

  return (
    <>
      <Breadcrumbs center={center} path="/weather/stations" hasStationsIndex />
      <div className="container mb-10 flex flex-col gap-6">
        <Intro />
        <section>
          <h2 className={sectionHeadingClass}>All stations</h2>
          <AllStationsLinks />
        </section>
        <section>
          <h2 className={sectionHeadingClass}>Stations</h2>
          <StationList pages={toPageSummaries(pages)} />
        </section>
      </div>
    </>
  )
}

function resolveParentTitle(parent: ResolvedMetadata): Metadata['title'] {
  const { title } = parent
  return typeof title === 'string' ? title : (title?.absolute ?? undefined)
}

export async function generateMetadata(
  _props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = await parent
  const parentTitle = resolveParentTitle(parentMeta)
  return {
    title: parentTitle ? `Weather Stations | ${parentTitle}` : 'Weather Stations',
    alternates: { canonical: '/weather/stations' },
  }
}
