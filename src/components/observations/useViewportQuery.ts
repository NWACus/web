'use client'

/**
 * One request to the viewer's own API for whatever the map is showing, re-made whenever its URL
 * changes. Filter changes wait 150ms, as the widget's do, so a burst of checkbox clicks is one
 * request; the viewport arrives already debounced by the map. A newer request aborts the one in
 * flight, so a slow response can never land over a newer one. While the map is moving to
 * somewhere the viewer sent it, the query waits for it to land. The list and the charts share
 * this; each builds its own URL.
 */
import { useEffect, useState } from 'react'

const FILTER_DEBOUNCE_MS = 150

export type QueryStatus<T> =
  | { state: 'waiting' }
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'error' }

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

/**
 * The response at `url`, or `waiting` while there is no URL to ask (no viewport yet, or nothing
 * to show on this tab). `moving` holds the query in `loading` until the map lands.
 */
export function useViewportQuery<T>(url: string | null, moving = false): QueryStatus<T> {
  const [status, setStatus] = useState<QueryStatus<T>>({ state: 'waiting' })

  useEffect(() => {
    if (!url) {
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
      fetchJson<T>(url, controller.signal)
        .then((data) => setStatus({ state: 'ready', data }))
        .catch((error) => {
          if (!isAbort(error)) setStatus({ state: 'error' })
        })
    }, FILTER_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [url, moving])

  return status
}
