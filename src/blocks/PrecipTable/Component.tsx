import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import { toStationRefs } from '@/fields/stations'
import type { PrecipTableBlock as PrecipTableBlockProps } from '@/payload-types'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { buildPrecipAccumulationTable } from '@/services/snowobs/tableHelpers'
import { toPrecipColumns } from '@/services/stations/precipColumns'

// The fetch's revalidate also becomes the page's: Next takes the shortest
// revalidate of any fetch on the route. That regenerates the whole page (nav,
// footer, every other block and their database reads), not just the table,
// six times more often than the page default of an hour. Ten minutes matches
// the station pages; the legacy route refreshed every five.
const REVALIDATE_SECONDS = 600

type Props = PrecipTableBlockProps & { center: string }

export async function PrecipTableBlockComponent({ center, stations, columns }: Props) {
  const refs = toStationRefs(stations)
  if (refs.length === 0) return null

  let table
  try {
    // One 72h fetch covers every trailing window (1H..72H are sums over it).
    const response = await fetchStationTimeseries(center, refs, {
      revalidate: REVALIDATE_SECONDS,
      windowHours: 72,
    })
    table = buildPrecipAccumulationTable(
      response,
      refs.map((s) => s.stid),
    )
  } catch {
    // Already logged with its context by fetchStationTimeseries; the page must
    // still render, so the table's place says so instead of the error boundary.
    return (
      <div className="container">
        <p className="text-sm text-muted-foreground">
          Precipitation data is unavailable right now. Please try again in a few minutes.
        </p>
      </div>
    )
  }

  return (
    <div className="container mb-10 flex flex-col gap-3">
      <PrecipAccumulationTable table={table} columns={toPrecipColumns(columns)} />
      <p className="text-sm text-muted-foreground">
        Data not quality controlled. Accumulated precipitation does not reflect weather station
        outages or other technical errors.
      </p>
    </div>
  )
}
