'use client'

import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationReadings } from '@/services/stations/reportedReadings'
import { useEffect, useState } from 'react'
import { createFetchOnce } from './fetchOnce'

type Readings = StationReadings
const NONE: Readings = { readings: {}, lastReported: {} }

export type ReportedReadings = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** The station's table readings; empty while unknown or when it has never reported. */
  of: (station: StationRef) => string[]
  /** When a station silent for the table's default window last reported, else null. */
  lastReported: (station: StationRef) => string | null
  message?: string
}

// One request per set of stations, shared by the stations table and the column order field.
const fetchReadings = createFetchOnce<Readings>()

function fetchOnce(center: string, keys: string): Promise<Readings> {
  const query = `center=${encodeURIComponent(center)}&stations=${encodeURIComponent(keys)}`
  return fetchReadings(`/api/stationPages/reported-readings?${query}`)
}

/** The readings the public table's default view shows for each station; skipped until enabled. */
export function useReportedReadings(
  center: string | null,
  stations: StationRef[],
  enabled = true,
): ReportedReadings {
  const active = enabled ? center : null
  const keys = Array.from(new Set(stations.map(stationKey)))
    .sort()
    .join(',')
  const [state, setState] = useState<{
    status: ReportedReadings['status']
    readings: Readings
    message?: string
  }>({
    status: 'idle',
    readings: NONE,
  })
  useEffect(() => {
    if (!active) return
    if (!keys) {
      setState({ status: 'ready', readings: NONE })
      return
    }
    let cancelled = false
    // Keep the last readings while a changed station list loads, so nothing flickers.
    setState((prev) => ({ ...prev, status: 'loading' }))
    fetchOnce(active, keys).then(
      (readings) => {
        if (!cancelled) setState({ status: 'ready', readings })
      },
      (error: unknown) => {
        if (!cancelled)
          setState((prev) => ({
            ...prev,
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not reach SnowObs.',
          }))
      },
    )
    return () => {
      cancelled = true
    }
  }, [active, keys])
  return {
    status: state.status,
    message: state.message,
    of: (station) => state.readings.readings[stationKey(station)] ?? [],
    lastReported: (station) => state.readings.lastReported[stationKey(station)] ?? null,
  }
}
