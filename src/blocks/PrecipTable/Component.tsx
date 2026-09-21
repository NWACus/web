import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import { toStationRefs } from '@/fields/stations'
import type { PrecipTableBlock as PrecipTableBlockProps } from '@/payload-types'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { buildPrecipAccumulationTable } from '@/services/snowobs/tableHelpers'
import { toPrecipColumns } from '@/services/stations/precipColumns'

// The fetch's revalidate also becomes the page's: Next takes the shortest
// revalidate of any fetch on the route, so a static page carrying this block
// regenerates on the legacy five-minute cadence rather than the page default.
const REVALIDATE_SECONDS = 300

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
