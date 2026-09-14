import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import type { StationPage } from '@/services/stations/getStationPages'
import { getStationPages } from '@/services/stations/getStationPages'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// The page list is cached per center and busted by the admin hooks, so this can
// stay static and still reflect a newly assigned station on the next request.
export const revalidate = 3600

type Args = {
  params: Promise<{ center: string }>
}

function StationLink({ page }: { page: StationPage }) {
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

function StationColumns({ pages }: { pages: StationPage[] }) {
  return (
    <ul className="columns-1 gap-8 leading-snug sm:columns-2 lg:columns-3">
      {pages.map((page) => (
        <StationLink key={page.slug} page={page} />
      ))}
    </ul>
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
    <div className="container">
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="font-bold">Weather Stations</h1>
        <p>
          Hourly readings from NWAC&apos;s weather stations. Each station has a table of recent
          observations, graphs back to the start of the season, and CSV downloads.
        </p>
      </div>
    </div>
  )
}

export default async function Page({ params }: Args) {
  const { center } = await params

  // A center with no station pages has no weather-stations section.
  const pages = await getStationPages(center)
  if (pages.length === 0) {
    notFound()
  }

  return (
    <>
      <Breadcrumbs center={center} path="/weather/stations" />
      <div className="mb-10 flex flex-col gap-8">
        {/* No station picker here — the list below already names every station. */}
        <Intro />

        <section className="container flex flex-col gap-2">
          <h2 className={sectionHeadingClass}>All stations</h2>
          <AllStationsLinks />
        </section>

        <section className="container flex flex-col gap-3">
          <h2 className={sectionHeadingClass}>By station</h2>
          <StationColumns pages={pages} />
        </section>
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
