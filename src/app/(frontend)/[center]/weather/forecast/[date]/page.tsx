import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { ForecastPage } from '@/components/NWACWeather/ForecastPage'
import { fmtCalendarDate } from '@/services/nac/nwacWeatherFormat'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { format, isValid, parseISO } from 'date-fns'
import { notFound } from 'next/navigation'

// Historical, like the dated avalanche route: no freshness check, and a long backstop. A date
// that is not yet past reads through the 300s data cache, which shortens the page's window too.
export const revalidate = 2592000 // 30 days

export function generateStaticParams() {
  return []
}

type Args = {
  params: Promise<{ center: string; date: string }>
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** A real day, not just the pattern: `2026-13-45` would otherwise reach the date formatter. */
const isCalendarDate = (date: string) => DATE.test(date) && isValid(parseISO(date))

/** NWAC's Mountain Weather for one date. Other centers have no dated weather page. */
export default async function Page({ params }: Args) {
  const { center, date } = await params
  if (center !== 'nwac' || !isCalendarDate(date)) notFound()
  if (!(await getNativeProductFlag(center, 'nwacWeather'))) notFound()

  return (
    <>
      <Breadcrumbs
        center={center}
        path={`/weather/forecast/${date}`}
        // The date picker's format.
        title={format(parseISO(date), 'MMM d, yyyy')}
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
