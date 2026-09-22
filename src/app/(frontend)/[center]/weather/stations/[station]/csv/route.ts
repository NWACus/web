import { buildStationCsv } from '@/services/snowobs/csv'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { parseStationKey, stationKey } from '@/services/snowobs/stationKey'
import { getStationPage } from '@/services/stations/getStationPages'
import { passesCaptcha } from '@/services/turnstile'
import { TZDate } from '@date-fns/tz'

const TZ = 'America/Vancouver'
const MIN_YEAR = 2016

type Args = {
  params: Promise<{ center: string; station: string }>
}

// Validates station and year against the page so this isn't an open SnowObs proxy.
// CRAP is inflated by the lack of unit coverage on this route handler.
// fallow-ignore-next-line complexity
export async function GET(request: Request, { params }: Args) {
  const { center, station } = await params
  const url = new URL(request.url)
  const requested = parseStationKey(url.searchParams.get('station') ?? '')
  const year = Number(url.searchParams.get('year'))

  const page = await getStationPage(center, station)
  if (!page) {
    return new Response('Unknown station', { status: 404 })
  }
  const datalogger = requested && page.stations.find((s) => stationKey(s) === stationKey(requested))
  if (!datalogger) {
    return new Response('Unknown or invalid datalogger', { status: 400 })
  }
  const currentYear = new Date().getUTCFullYear()
  if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear) {
    return new Response('Invalid year', { status: 400 })
  }
  const units = url.searchParams.get('units') ?? 'imperial'
  if (units !== 'imperial' && units !== 'metric') {
    return new Response('Invalid units', { status: 400 })
  }
  if (!(await passesCaptcha(url.searchParams.get('cf-turnstile-response')))) {
    return new Response('Captcha verification failed', { status: 403 })
  }

  // Calendar year in Pacific time, as UTC instants for the SnowObs request.
  const start = new Date(new TZDate(year, 0, 1, 0, 0, 0, 0, TZ).getTime())
  const end = new Date(new TZDate(year, 11, 31, 23, 59, 59, 999, TZ).getTime())

  const response = await fetchStationTimeseries(center, [datalogger], {
    start,
    end,
    revalidate: 3600,
    rawData: true,
  })
  const csv = buildStationCsv(response, datalogger, units)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${page.slug}-${datalogger.stid}-${year}.csv"`,
    },
  })
}
