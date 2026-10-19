import { parseStationKeys } from '@/services/snowobs/stationKey'
import { fetchReportedReadings } from '@/services/stations/reportedReadings'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { PayloadHandler } from 'payload'

const MAX_STATIONS = 60

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
    return Response.json(await fetchReportedReadings(center, stations))
  } catch (error) {
    req.payload.logger.error({ err: error, center }, 'reported readings lookup failed')
    return Response.json(
      { error: error instanceof Error ? error.message : 'SnowObs lookup failed' },
      { status: 502 },
    )
  }
}
