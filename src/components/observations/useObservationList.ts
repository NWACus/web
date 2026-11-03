'use client'

/**
 * One page of the showing tab's list, for the map's viewport (inventory row O11).
 *
 * Fetched from `/api/<center>/observations/…/list` whenever the tab, filters, sort, page or
 * viewport change. Filter changes wait 150ms, as the widget's do, so a burst of checkbox clicks
 * is one request; the viewport arrives already debounced by the map. A newer request aborts the
 * one in flight, so a slow response can never land over a newer one. While the map is moving to
 * somewhere the viewer sent it, the list waits for it to land.
 */
import { useEffect, useState } from 'react'

import type { ObservationKind } from '@/services/nac/model/observation'
import type { ObservationListResponse } from '@/services/nac/observations/cards'
import type { BBox } from '@/services/nac/observations/listParams'
import { tabPath } from '@/services/nac/observations/routes'

const FILTER_DEBOUNCE_MS = 150

export type ListStatus =
  | { state: 'waiting' }
  | { state: 'loading' }
  | { state: 'ready'; data: ObservationListResponse }
  | { state: 'error' }

interface ListQuery {
  centerSlug: string
  kind: ObservationKind
  /** The viewer's query string (`writeFilters`), plus explicit dates. */
  search: string
  bbox: BBox | null
  /** The map is on its way somewhere else; its viewport is about to change. */
  moving?: boolean
}

function listUrl({ centerSlug, kind, search, bbox }: ListQuery & { bbox: BBox }): string {
  const params = new URLSearchParams(search)
  params.set('bbox', bbox.map((value) => value.toFixed(5)).join(','))
  return `/api/${centerSlug}${tabPath(kind)}/list?${params.toString()}`
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

async function fetchList(url: string, signal: AbortSignal): Promise<ObservationListResponse> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

export function useObservationList(query: ListQuery): ListStatus {
  const [status, setStatus] = useState<ListStatus>({ state: 'waiting' })
  const { centerSlug, kind, search, bbox, moving = false } = query
  const bboxKey = bbox?.join(',') ?? null

  useEffect(() => {
    if (!bbox) {
      setStatus({ state: 'waiting' })
      return
    }
    if (moving) {
      setStatus({ state: 'loading' })
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setStatus({ state: 'loading' })
      fetchList(listUrl({ centerSlug, kind, search, bbox }), controller.signal)
        .then((data) => setStatus({ state: 'ready', data }))
        .catch((error) => {
          if (!isAbort(error)) setStatus({ state: 'error' })
        })
    }, FILTER_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
    // `bboxKey` stands for `bbox`, whose identity changes more often than its value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerSlug, kind, search, bboxKey, moving])

  return status
}
