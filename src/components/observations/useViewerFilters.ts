'use client'

/**
 * The viewer's filters and list state (sort, page), and where they live: the query string, so a
 * filtered view is a link. Written with `replaceState` — narrowing a list is not a navigation, and
 * a back button that undid one filter at a time would be useless — and only while no record is
 * open, since a record's own address carries no filters.
 *
 * "Today" is the center's, and it is re-read every minute: the widget computed it once when its
 * script loaded, so a viewer left open overnight kept offering yesterday's presets.
 */
import { useCallback, useEffect, useState } from 'react'

import { todayInTimezone } from '@/services/nac/forecastArchive'
import type { ObservationKind } from '@/services/nac/model/observation'
import {
  readFilters,
  readListState,
  writeFilters,
  type ListState,
  type ObservationFilters,
} from '@/services/nac/observations/filters'
import { tabPath } from '@/services/nac/observations/routes'

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
  prefix: string
  tab: ObservationKind
  recordOpen: boolean
}

export function useViewerFilters({
  timezone,
  centerId,
  prefix,
  tab,
  recordOpen,
}: ViewerFiltersOptions) {
  const today = useToday(timezone)
  const [filters, setFiltersState] = useState<ObservationFilters>(() =>
    readFilters(window.location.search, todayInTimezone(timezone)),
  )
  const [list, setListState] = useState<ListState>(() => readListState(window.location.search))

  /** New filters start the list over from its first page, as the widget's do. */
  const setFilters = useCallback((next: ObservationFilters) => {
    setFiltersState(next)
    setListState((current) => ({ ...current, page: 1 }))
  }, [])

  const setList = useCallback((patch: Partial<ListState>) => {
    setListState((current) => ({ ...current, ...patch }))
  }, [])

  const listSearch = writeFilters(window.location.search, filters, list, { today, centerId })

  useEffect(() => {
    if (recordOpen) return
    const url = `${prefix}${tabPath(tab)}${listSearch}`
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, '', url)
    }
  }, [listSearch, prefix, tab, recordOpen])

  return { today, filters, setFilters, list, setList, listSearch }
}
