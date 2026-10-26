import { passesCaptcha } from '@/services/turnstile'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { TZDate } from '@date-fns/tz'
import { buildStationCsv } from './csv'
import { fetchStationTimeseries } from './snowobs'
import type { StationRef } from './stationKey'
import { parseStationKey, stationKey } from './stationKey'

const MIN_YEAR = 2016

type CsvDownloadOptions = {
  center: string
  /** The stations this route may serve; the requested one must be among them. */
  dataloggers: StationRef[]
  /** Leads the file name, ahead of the stid and year. */
  filePrefix: string
}

// Validates datalogger and year against what the caller allows, so the CSV
// routes aren't an open SnowObs proxy.
// CRAP is inflated by the lack of unit coverage on this route helper.
// fallow-ignore-next-line complexity
export async function stationCsvDownload(
  request: Request,
  { center, dataloggers, filePrefix }: CsvDownloadOptions,
): Promise<Response> {
  const url = new URL(request.url)
  const requested = parseStationKey(url.searchParams.get('station') ?? '')
  const year = Number(url.searchParams.get('year'))

  const datalogger = requested && dataloggers.find((s) => stationKey(s) === stationKey(requested))
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

  // Calendar year in the center's timezone, as UTC instants for the SnowObs request.
  const timeZone = centerTimezone(center)
  const start = new Date(new TZDate(year, 0, 1, 0, 0, 0, 0, timeZone).getTime())
  const end = new Date(new TZDate(year, 11, 31, 23, 59, 59, 999, timeZone).getTime())

  const response = await fetchStationTimeseries(center, [datalogger], {
    start,
    end,
    revalidate: 3600,
    rawData: true,
  })
  const csv = buildStationCsv(center, response, datalogger, units)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filePrefix}-${datalogger.stid}-${year}.csv"`,
    },
  })
}
