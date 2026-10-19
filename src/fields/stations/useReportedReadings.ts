'use client'

import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import { useEffect, useState } from 'react'

type Readings = Record<string, string[]>

export type ReportedReadings = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** The station's table readings; empty while unknown or when it has none in the window. */
  of: (station: StationRef) => string[]
  message?: string
}

// One request per set of stations, shared by the stations table and the column order field.
const cache = new Map<string, Promise<Readings>>()

async function load(center: string, keys: string): Promise<Readings> {
  const response = await fetch(
    `/api/stationPages/reported-readings?center=${encodeURIComponent(center)}&stations=${encodeURIComponent(keys)}`,
    { credentials: 'include' },
  )
  const body = await response.json()
  if (!response.ok) throw new Error(body.error ?? `SnowObs lookup failed (${response.status})`)
  return body.readings
}

function fetchOnce(center: string, keys: string): Promise<Readings> {
  const id = `${center}|${keys}`
  const cached = cache.get(id)
  if (cached) return cached
  const pending = load(center, keys).catch((error) => {
    cache.delete(id)
    throw error
  })
  cache.set(id, pending)
  return pending
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
    readings: {},
  })
  useEffect(() => {
    if (!active) return
    if (!keys) {
      setState({ status: 'ready', readings: {} })
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
    of: (station) => state.readings[stationKey(station)] ?? [],
  }
}
