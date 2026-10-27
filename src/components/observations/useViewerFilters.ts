'use client'

/**
 * The viewer's filters and list state (sort, page), and where they live: the query string, so a
 * filtered view is a link. Written with `replaceState` — narrowing a list is not a navigation, and
 * a back button that undid one filter at a time would be useless — and only while no record is
 * open, since a record's own address carries no filters. Back and forward land on entries with
 * their own filters, so those are read back from the URL, as the widget re-reads it on every route.
 *
 * "Today" is the center's, and it is re-read every minute: the widget computed it once when its
 * script loaded, so a viewer left open overnight kept offering yesterday's presets.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { todayInTimezone } from '@/services/nac/forecastArchive'
import type { ObservationZoneOption } from '@/services/nac/model/observation'
import {
  readFilters,
  readListState,
  writeFilters,
  zoneIdsForNames,
  type ListState,
  type ObservationFilters,
} from '@/services/nac/observations/filters'
import { readViewerPath } from '@/services/nac/observations/routes'

const TODAY_TICK_MS = 60_000

function useToday(timezone: string): string {
  const [today, setToday] = useState(() => todayInTimezone(timezone))
  useEffect(() => {
    const interval = window.setInterval(() => setToday(todayInTimezone(timezone)), TODAY_TICK_MS)
    return () => window.clearInterval(interval)
  }, [timezone])
  return today
}

interface ViewerFiltersOptions {
  timezone: string
  centerId: string
  recordOpen: boolean
  zones: ObservationZoneOption[]
}

function filtersFromUrl(timezone: string, zones: ObservationZoneOption[]): ObservationFilters {
  const read = readFilters(window.location.search, todayInTimezone(timezone))
  return { ...read, zones: zoneIdsForNames(read.zones, zones) }
}

/** A history entry the reader returns to keeps the filters it had; a record's entry has none. */
function useFiltersFromHistory(onListEntry: () => void) {
  const callbackRef = useRef(onListEntry)
  callbackRef.current = onListEntry
  useEffect(() => {
    const onPopState = () => {
      if (readViewerPath(window.location.pathname)?.detail) return
      callbackRef.current()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
}

export function useViewerFilters({ timezone, centerId, recordOpen, zones }: ViewerFiltersOptions) {
  const today = useToday(timezone)
  const [filters, setFiltersState] = useState<ObservationFilters>(() =>
    filtersFromUrl(timezone, zones),
  )
  const [list, setListState] = useState<ListState>(() => readListState(window.location.search))
  useFiltersFromHistory(() => {
    setFiltersState(filtersFromUrl(timezone, zones))
    setListState(readListState(window.location.search))
  })

  /** New filters start the list over from its first page, as the widget's do. */
  const setFilters = useCallback((next: ObservationFilters) => {
    setFiltersState(next)
    setListState((current) => ({ ...current, page: 1 }))
  }, [])

  const setList = useCallback((patch: Partial<ListState>) => {
    setListState((current) => ({ ...current, ...patch }))
  }, [])

  const context = { today, centerId }
  const listSearch = writeFilters(window.location.search, filters, list, context)
  /** What the other tab opens with: these filters, from its first page, as the widget's tabs do. */
  const tabSearch = writeFilters(window.location.search, filters, { ...list, page: 1 }, context)

  // Only the query string is this hook's; the path is the tab's, which moves on its own.
  useEffect(() => {
    if (recordOpen || listSearch === window.location.search) return
    window.history.replaceState(null, '', `${window.location.pathname}${listSearch}`)
  }, [listSearch, recordOpen])

  return { today, filters, setFilters, list, setList, listSearch, tabSearch }
}
