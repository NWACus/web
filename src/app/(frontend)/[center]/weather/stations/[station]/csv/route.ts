import { stationCsvDownload } from '@/services/snowobs/csvDownload'
import { getStationPage } from '@/services/stations/getStationPages'

type Args = {
  params: Promise<{ center: string; station: string }>
}

// A page's CSV serves only the loggers that page lists.
export async function GET(request: Request, { params }: Args) {
  const { center, station } = await params
  const page = await getStationPage(center, station)
  if (!page) {
    return new Response('Unknown station', { status: 404 })
  }
  return stationCsvDownload(request, {
    center,
    dataloggers: page.stations,
    filePrefix: page.slug,
  })
}
