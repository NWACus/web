'use client'

import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import { useStationUnits } from '@/components/WeatherStations/UnitToggle'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { PrecipAccumulationTable as PrecipAccumulationData } from '@/services/snowobs/tableHelpers'
import type { StationUnits } from '@/services/snowobs/units'
import type { PrecipColumn } from '@/services/stations/precipColumns'
import { useEffect, useState } from 'react'

type State =
  | { status: 'loading' }
  | { status: 'ready'; table: PrecipAccumulationData }
  | { status: 'error' }

// Fetched in the browser so the block keeps its own refresh cadence: a server
// fetch's revalidate becomes the revalidate of every page carrying the block.
function usePrecipTable(stations: StationRef[], units: StationUnits): State {
  const keys = stations.map(stationKey).join(',')
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    const params = new URLSearchParams({ stations: keys, units })
    fetch(`/weather/precip-data?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((table: PrecipAccumulationData) => setState({ status: 'ready', table }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [keys, units])

  return state
}

function Notice({ children }: { children: string }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

export function PrecipTableClient({
  stations,
  columns,
}: {
  stations: StationRef[]
  columns: PrecipColumn[]
}) {
  const [units, setUnits] = useStationUnits()
  const state = usePrecipTable(stations, units)

  if (state.status === 'loading') {
    return (
      <div
        role="status"
        aria-label="Loading precipitation totals"
        className="h-96 animate-pulse rounded-md bg-muted"
      />
    )
  }
  if (state.status === 'error') {
    return <Notice>Precipitation data is unavailable right now. Please try again shortly.</Notice>
  }
  return (
    <>
      <PrecipAccumulationTable
        table={state.table}
        unit={units}
        onUnitChange={setUnits}
        columns={columns}
      />
      <Notice>
        Data not quality controlled. Accumulated precipitation does not reflect weather station
        outages or other technical errors.
      </Notice>
    </>
  )
}
