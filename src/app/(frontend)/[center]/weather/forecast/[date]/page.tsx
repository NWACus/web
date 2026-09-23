import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { ForecastPage } from '@/components/weather/nwac/ForecastPage'
import { fmtCalendarDate } from '@/services/nac/nwacWeatherFormat'
import { notFound } from 'next/navigation'

// Rendered on first request, then refreshed like today's page in case of a correction.
export const revalidate = 300

export function generateStaticParams() {
  return []
}

type Args = {
  params: Promise<{ center: string; date: string }>
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** NWAC's Mountain Weather for one date. Other centers have no dated weather page. */
export default async function Page({ params }: Args) {
  const { center, date } = await params
  if (center !== 'nwac' || !DATE.test(date)) notFound()

  return (
    <>
      <Breadcrumbs
        center={center}
        path={`/weather/forecast/${date}`}
        title={fmtCalendarDate(date)}
      />
      <ForecastPage centerSlug={center} date={date} />
    </>
  )
}

export async function generateMetadata(
  props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { date } = await props.params
  const parentMeta = await parent
  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  return {
    title: `Mountain Weather ${fmtCalendarDate(date)} | ${parentTitle}`,
    alternates: { canonical: `/weather/forecast/${date}` },
  }
}
