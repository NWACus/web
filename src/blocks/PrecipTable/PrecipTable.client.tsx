'use client'

import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import { useStationUnits } from '@/components/WeatherStations/UnitToggle'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { PrecipAccumulationTable as PrecipAccumulationData } from '@/services/snowobs/tableHelpers'
import type { StationUnits } from '@/services/snowobs/units'
import type { PrecipColumn } from '@/services/stations/precipColumns'
import { cn } from '@/utilities/ui'
import { useEffect, useState } from 'react'

type State =
  | { status: 'loading' }
  | { status: 'ready'; table: PrecipAccumulationData; units: StationUnits; refreshing: boolean }
  | { status: 'error' }

// Fetched in the browser so the block keeps its own refresh cadence: a server
// fetch's revalidate becomes the revalidate of every page carrying the block.
// A unit change keeps the table, in the units it was read in, on screen while it refetches, so
// its sort survives and a failed refetch leaves it there.
// `attempt` lets a repeated toggle retry after a failed refetch left the saved units unchanged.
function usePrecipTable(
  stations: StationRef[],
  units: StationUnits,
  unitsLoaded: boolean,
  attempt: number,
): State {
  const keys = stations.map(stationKey).join(',')
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (!unitsLoaded) return
    const controller = new AbortController()
    setState((prev) =>
      prev.status === 'ready' ? { ...prev, refreshing: true } : { status: 'loading' },
    )
    const params = new URLSearchParams({ stations: keys, units })
    fetch(`/weather/precip-data?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((table: PrecipAccumulationData) =>
        setState({ status: 'ready', table, units, refreshing: false }),
      )
      .catch(() => {
        if (controller.signal.aborted) return
        setState((prev) =>
          prev.status === 'ready' ? { ...prev, refreshing: false } : { status: 'error' },
        )
      })
    return () => controller.abort()
  }, [keys, units, unitsLoaded, attempt])

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
  const [units, setUnits, unitsLoaded] = useStationUnits()
  const [attempt, setAttempt] = useState(0)
  const state = usePrecipTable(stations, units, unitsLoaded, attempt)
  const changeUnits = (next: StationUnits) => {
    setUnits(next)
    setAttempt((n) => n + 1)
  }

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
      <div aria-busy={state.refreshing} className={cn(state.refreshing && 'opacity-60')}>
        <PrecipAccumulationTable
          table={state.table}
          unit={state.units}
          onUnitChange={changeUnits}
          columns={columns}
        />
      </div>
      <Notice>
        Data not quality controlled. Accumulated precipitation does not reflect weather station
        outages or other technical errors.
      </Notice>
    </>
  )
}
