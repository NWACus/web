'use client'

import type { Event } from '@/payload-types'
import type { LatLng } from '@/utilities/geo/distance'
import type { GetEventsResult } from '@/utilities/queries/getEvents'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { NearOrigin } from './useNearOrigin'

/**
 * A ceiling on one load, not a page size: centers list a few dozen upcoming events, so this only
 * bites on a wide date range, and `CappedNotice` says so.
 */
const MAP_EVENTS_LIMIT = 200

/** The page's filter params, which the events API reads in the same comma-separated format. */
const FILTER_KEYS = ['types', 'startDate', 'endDate', 'groups', 'tags', 'modesOfTravel', 'bbox']

type Loaded = { events: Event[]; total: number; error: null } | { events: null; error: string }

/**
 * The last events loaded stay up while the next set loads, so pins and cards don't flash away.
 * `near` is the origin they were sorted from.
 */
export type EventsState = (Loaded | { events: null; error: null }) & {
  loading: boolean
  near: string
}

async function loadEvents(url: string, signal: AbortSignal): Promise<Loaded | null> {
  try {
    const result: GetEventsResult = await fetch(url, { signal }).then((res) => res.json())
    return result.error
      ? { events: null, error: result.error }
      : { events: result.events, total: result.total, error: null }
  } catch {
    return signal.aborted ? null : { events: null, error: 'Failed to load events.' }
  }
}

/** The events API query: the page's filters, the origin to sort from, and one load's ceiling. */
function eventsQuery(searchParams: Pick<URLSearchParams, 'get'>, near: string): string {
  const query = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key)
    if (value) query.set(key, value)
  }
  if (near) query.set('near', near)
  query.set('limit', String(MAP_EVENTS_LIMIT))
  return query.toString()
}

/** Every event matching the page's filters, unpaginated, nearest first when sorted by distance. */
export function useAllFilteredEvents(center: string, origin: NearOrigin | null): EventsState {
  const near = origin?.query ?? ''
  const queryString = eventsQuery(useSearchParams(), near)

  const [state, setState] = useState<EventsState>({
    events: null,
    error: null,
    loading: true,
    near: '',
  })
  useEffect(() => {
    const controller = new AbortController()
    setState((previous) => ({ ...previous, loading: true }))
    loadEvents(`/api/${center}/events?${queryString}`, controller.signal).then((next) => {
      if (next) setState({ ...next, loading: false, near })
    })
    return () => controller.abort()
  }, [center, queryString, near])

  return state
}

/** Where the cards measure distance from: only once the events on screen were sorted from there. */
export function distanceOrigin(state: EventsState, origin: NearOrigin | null): LatLng | null {
  return origin && state.near === origin.query ? origin.point : null
}
