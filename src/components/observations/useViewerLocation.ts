'use client'

/**
 * Which tab the viewer shows and which record is open over it, read from the address bar.
 *
 * Switching tabs and opening a record change the URL with `history.pushState` rather than a Next
 * navigation. Both tabs and both detail routes are real pages — load one directly and the server
 * renders it — but inside the viewer the map, the list and the filters stay mounted, as the
 * widget's hash router kept them. Next's app router adopts a native `pushState` (it copies its
 * tree into the new entry and updates `usePathname`), and the back button walks these entries
 * like any other: back from an open record closes it, back from a tab switch switches back.
 */
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ObservationKind } from '@/services/nac/model/observation'
import {
  detailPath,
  readViewerPath,
  tabPath,
  type ViewerLocation,
} from '@/services/nac/observations/routes'

export interface OpenRecord {
  kind: ObservationKind
  id: string
}

/**
 * The list keeps its tab while a record is open over it — an avalanche opened from an
 * observation's detail has an avalanches address, but the observations list stays underneath.
 */
function useListTab(location: ViewerLocation) {
  const [tab, setTab] = useState<ObservationKind>(location.tab)
  const listTab = location.detail ? null : location.tab
  useEffect(() => {
    if (listTab) setTab(listTab)
  }, [listTab])
  return tab
}

/**
 * Opening and closing records. Stepping to the previous or next record replaces the entry, so
 * back still closes the modal rather than walking through every record seen; opening an
 * avalanche from its observation pushes one, so back returns to the observation. Closing goes
 * back past every entry this viewer pushed, to the list as it was.
 */
function useRecordHistory(prefix: string, tab: ObservationKind, recordOpen: boolean) {
  const openedRef = useRef(0)
  useEffect(() => {
    if (!recordOpen) openedRef.current = 0
  }, [recordOpen])

  const openRecord = useCallback(
    (record: OpenRecord, options: { replace?: boolean } = {}) => {
      const url = `${prefix}${detailPath(record.kind, record.id)}`
      if (options.replace && openedRef.current > 0) {
        window.history.replaceState(null, '', url)
        return
      }
      openedRef.current += 1
      window.history.pushState(null, '', url)
    },
    [prefix],
  )

  const closeRecord = useCallback(
    (listSearch: string) => {
      if (openedRef.current > 0) window.history.go(-openedRef.current)
      else window.history.pushState(null, '', `${prefix}${tabPath(tab)}${listSearch}`)
    },
    [prefix, tab],
  )

  return { openRecord, closeRecord }
}

export function useViewerLocation(initialTab: ObservationKind) {
  // Only ever mounted on one of its own paths; the fallback covers a path it doesn't recognize.
  const location = readViewerPath(usePathname()) ?? { prefix: '', tab: initialTab, detail: null }
  const { prefix, detail } = location
  const tab = useListTab(location)
  const { openRecord, closeRecord } = useRecordHistory(prefix, tab, detail !== null)

  const openTab = useCallback(
    (kind: ObservationKind) => {
      window.history.pushState(null, '', `${prefix}${tabPath(kind)}${window.location.search}`)
    },
    [prefix],
  )

  return { prefix, tab, detail, openTab, openRecord, closeRecord }
}
