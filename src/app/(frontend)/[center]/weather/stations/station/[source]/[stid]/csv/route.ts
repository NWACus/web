import { stationCsvDownload } from '@/services/snowobs/csvDownload'
import { findServedStation } from '@/services/snowobs/trackedStations'

type Args = {
  params: Promise<{ center: string; source: string; stid: string }>
}

// A single station's CSV, for a station the center tracks and nothing else.
export async function GET(request: Request, { params }: Args) {
  const { center, source, stid } = await params
  const station = await findServedStation(center, { source, stid })
  if (!station) {
    return new Response('Unknown station', { status: 404 })
  }
  return stationCsvDownload(request, {
    center,
    dataloggers: [{ source: station.source, stid: station.stid }],
    filePrefix: station.source,
  })
}
