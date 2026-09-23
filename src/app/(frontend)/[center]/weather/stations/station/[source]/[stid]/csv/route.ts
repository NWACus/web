import { stationCsvDownload } from '@/services/snowobs/csvDownload'
import { findTrackedStation } from '@/services/snowobs/trackedStations'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'

type Args = {
  params: Promise<{ center: string; source: string; stid: string }>
}

// A single station's CSV, for a station the center tracks and nothing else.
export async function GET(request: Request, { params }: Args) {
  const { center, source, stid } = await params
  const station = isValidTenantSlug(center) && (await findTrackedStation(center, { source, stid }))
  if (!station) {
    return new Response('Unknown station', { status: 404 })
  }
  return stationCsvDownload(request, {
    center,
    dataloggers: [{ source: station.source, stid: station.stid }],
    filePrefix: station.source,
  })
}
