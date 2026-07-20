import { getStationGroup } from '@/constants/weatherStations'
import { buildStationCsv } from '@/services/snowobs/csv'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { TZDate } from '@date-fns/tz'

const TZ = 'America/Vancouver'
const MIN_YEAR = 2016

type Args = {
  params: Promise<{ center: string; station: string }>
}

// GET /weather/stations/[station]/csv?stid=&year= — full-year hourly CSV for one
// datalogger. Validates stid against the station group and year against range so
// this isn't an open SnowObs proxy.
// CRAP is inflated by the lack of unit coverage on this route handler.
// fallow-ignore-next-line complexity
export async function GET(request: Request, { params }: Args) {
  const { station } = await params
  const url = new URL(request.url)
  const stid = url.searchParams.get('stid')
  const year = Number(url.searchParams.get('year'))

  const group = getStationGroup(station)
  if (!group) {
    return new Response('Unknown station', { status: 404 })
  }
  if (!stid || !group.stids.includes(stid)) {
    return new Response('Unknown or invalid datalogger', { status: 400 })
  }
  const currentYear = new Date().getUTCFullYear()
  if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear) {
    return new Response('Invalid year', { status: 400 })
  }

  // Calendar year in Pacific time, as UTC instants for the SnowObs request.
  const start = new Date(new TZDate(year, 0, 1, 0, 0, 0, 0, TZ).getTime())
  const end = new Date(new TZDate(year, 11, 31, 23, 59, 59, 999, TZ).getTime())

  const response = await fetchStationTimeseries([stid], { start, end, revalidate: 3600 })
  const csv = buildStationCsv(response, stid)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${group.slug}-${stid}-${year}.csv"`,
    },
  })
}
