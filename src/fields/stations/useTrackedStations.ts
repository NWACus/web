'use client'

import type { TrackedStation } from '@/services/snowobs/stationTracking'
import { getSlugFromTenantId } from '@/utilities/getSlugFromTenantId'
import { useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export type TrackedStations =
  | { status: 'loading'; stations: [] }
  | { status: 'ready'; stations: TrackedStation[] }
  | { status: 'error'; stations: []; message: string }

// One request per center per admin tab, shared by every picker and row label
// on the form. Module scope survives re-renders, row reorders and client-side
// navigation, so a station SnowObs starts tracking shows after a full reload.
const cache = new Map<string, Promise<TrackedStation[]>>()

async function load(center: string): Promise<TrackedStation[]> {
  const response = await fetch(
    `/api/stationPages/tracked-stations?center=${encodeURIComponent(center)}`,
    { credentials: 'include' },
  )
  const body = await response.json()
  if (!response.ok) throw new Error(body.error ?? `SnowObs lookup failed (${response.status})`)
  return body.stations
}

function fetchOnce(center: string): Promise<TrackedStation[]> {
  const cached = cache.get(center)
  if (cached) return cached
  const pending = load(center).catch((error) => {
    cache.delete(center)
    throw error
  })
  cache.set(center, pending)
  return pending
}

// The page's center, from the tenant field on the form (set from the cookie
// on a new page, so it is available before the first save).
export function useCenterSlug(): string | null {
  const tenant = useFormFields(([fields]) => fields.tenant?.value)
  const tenantId = typeof tenant === 'number' ? tenant : undefined
  const [slug, setSlug] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    getSlugFromTenantId(tenantId).then((s) => {
      if (!cancelled) setSlug(s)
    })
    return () => {
      cancelled = true
    }
  }, [tenantId])
  return slug
}

export function useTrackedStations(center: string | null): TrackedStations {
  const [state, setState] = useState<TrackedStations>({ status: 'loading', stations: [] })
  useEffect(() => {
    if (!center) return
    let cancelled = false
    setState({ status: 'loading', stations: [] })
    fetchOnce(center).then(
      (stations) => {
        if (!cancelled) setState({ status: 'ready', stations })
      },
      (error: unknown) => {
        if (!cancelled)
          setState({
            status: 'error',
            stations: [],
            message: error instanceof Error ? error.message : 'Could not reach SnowObs.',
          })
      },
    )
    return () => {
      cancelled = true
    }
  }, [center])
  return state
}
