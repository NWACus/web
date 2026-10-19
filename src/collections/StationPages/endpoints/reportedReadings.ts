import { resolveTablePeriod } from '@/components/WeatherStations/stationPeriods'
import { readingsByStation } from '@/services/snowobs/deriveColumns'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { parseStationKeys } from '@/services/snowobs/stationKey'
import { centerTimezone, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { PayloadHandler } from 'payload'

const MAX_STATIONS = 60

/**
 * The readings each station's table column comes from, read from the same fetch as the public
 * table's default view so the admin lists exactly the columns that view shows.
 */
export const reportedReadings: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }
  const params = req.url ? new URL(req.url).searchParams : new URLSearchParams()
  const center = params.get('center')
  if (!center || !isValidTenantSlug(center)) {
    return Response.json({ error: 'center must be a known avalanche center' }, { status: 400 })
  }
  const stations = parseStationKeys(params.get('stations'), MAX_STATIONS)
  if (typeof stations === 'string') {
    return Response.json({ error: stations }, { status: 400 })
  }
  try {
    const response = await fetchStationTimeseries(center, stations, {
      windowHours: resolveTablePeriod(undefined).hoursBack(new Date(), centerTimezone(center)),
      // The table's own options, so the two share a cached response.
      revalidate: 60,
      rawData: true,
    })
    return Response.json({ readings: readingsByStation(response, stations) })
  } catch (error) {
    req.payload.logger.error({ err: error, center }, 'reported readings lookup failed')
    return Response.json(
      { error: error instanceof Error ? error.message : 'SnowObs lookup failed' },
      { status: 502 },
    )
  }
}
