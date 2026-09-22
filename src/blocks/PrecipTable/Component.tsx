import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import { toStationRefs } from '@/fields/stations'
import type { PrecipTableBlock as PrecipTableBlockProps } from '@/payload-types'
import { fetchStationTimeseries, SnowObsError } from '@/services/snowobs/snowobs'
import { buildPrecipAccumulationTable } from '@/services/snowobs/tableHelpers'
import { toPrecipColumns } from '@/services/stations/precipColumns'

// The fetch's revalidate also becomes the page's: Next takes the shortest
// revalidate of any fetch on the route, so the whole page regenerates with the
// table. ISR counts that window from the last render rather than the clock, so
// an hourly window against SnowObs's hourly ingest can sit an hour behind the
// newest reading; 15 minutes bounds it. SnowObs is still read once an hour,
// since the fetch is cached and bucketed, so the extra cost is render time.
// Moving the table to a client fetch would decouple the two cadences.
const REVALIDATE_SECONDS = 900

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
    table = buildPrecipAccumulationTable(response, refs)
  } catch (error) {
    // SnowObs being unreachable is expected, and the fetch has already logged it
    // with the stations it asked for, so the page renders with the table's place
    // saying so. Anything else is our own bug and belongs in the error boundary.
    if (!(error instanceof SnowObsError)) throw error
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
