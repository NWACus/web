// The same false positive the sibling `api/[center]` routes waive; see `forecast-archive`.
// fallow-ignore-file dynamic-segment-name-conflicts
import { parseDateWindow } from '@/services/nac/archiveDates'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { getNWACWeatherSource } from '@/services/nac/sources'
import { unknownCenterResponse } from '@/utilities/apiResponses'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Lazy-load source for NWAC's Mountain Weather date picker: the dates with a published forecast
 * in a `from`..`to` window, so the calendar can offer further months without the page shipping
 * the whole list. The NWAC counterpart of `forecast-archive`. A failed read is a 500, which the
 * picker treats as "leave the month unloaded and retry".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  if (center !== 'nwac') return unknownCenterResponse()

  const query = request.nextUrl.searchParams
  const window = parseDateWindow(query.get('from'), query.get('to'))
  if (!window) {
    return NextResponse.json({ error: 'Invalid from/to parameters' }, { status: 400 })
  }

  const { timezone } = await getAvalancheCenterMetadata(center)
  const historical = window.to < todayInTimezone(timezone)
  const dates = await getNWACWeatherSource().getDates(window.from, window.to, { historical })

  return NextResponse.json(
    { dates },
    {
      // A past window never changes, and the current one only gains a date a day.
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' },
    },
  )
}
