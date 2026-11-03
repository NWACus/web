import { passesCaptcha } from '@/services/turnstile'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { TZDate } from '@date-fns/tz'
import { buildStationCsv } from './csv'
import type { FetchOptions } from './snowobs'
import { fetchStationTimeseries, SnowObsError } from './snowobs'
import type { StationRef } from './stationKey'
import { parseStationKey, stationKey } from './stationKey'
import type { SnowObsTimeseriesResponse } from './types/schemas'
import { parseStationUnits } from './units'

const MIN_YEAR = 2016

// A download is the logger's whole record: raw gets every sensor, not only Tracked Variables.
// SnowObs has 500'd raw reads for some airport stations, which then come back rounded.
async function fetchCsvTimeseries(
  center: string,
  datalogger: StationRef,
  options: FetchOptions,
): Promise<SnowObsTimeseriesResponse> {
  try {
    return await fetchStationTimeseries(center, [datalogger], { ...options, rawData: true })
  } catch (error) {
    if (!(error instanceof SnowObsError) || error.context?.status !== 500) throw error
    return fetchStationTimeseries(center, [datalogger], options)
  }
}

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
  const units = parseStationUnits(url.searchParams.get('units'))
  if (!units) {
    return new Response('Invalid units', { status: 400 })
  }
  if (!(await passesCaptcha(url.searchParams.get('cf-turnstile-response')))) {
    return new Response('Captcha verification failed', { status: 403 })
  }

  // Calendar year in the center's timezone, as UTC instants for the SnowObs request.
  const timeZone = centerTimezone(center)
  const start = new Date(new TZDate(year, 0, 1, 0, 0, 0, 0, timeZone).getTime())
  const end = new Date(new TZDate(year, 11, 31, 23, 59, 59, 999, timeZone).getTime())

  const response = await fetchCsvTimeseries(center, datalogger, {
    start,
    end,
    revalidate: 3600,
    units,
  })
  const csv = buildStationCsv(center, response, datalogger)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filePrefix}-${datalogger.stid}-${year}.csv"`,
    },
  })
}
