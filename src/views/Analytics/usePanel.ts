'use client'

import type { AnalyticsPanel, PanelData, PanelResponse } from '@/services/posthog/panelTypes'
import { useEffect, useState } from 'react'
import { z } from 'zod'

export type PanelRequest = {
  center: string
  from: string
  to: string
  /** Bumped by the Refresh button; `force` skips both caches once. */
  generation: number
  force: boolean
}

export type PanelState<T extends PanelData> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T; range: PanelResponse['range'] }

const LOADING: { status: 'loading' } = { status: 'loading' }

function isPanelResponse(value: unknown): value is PanelResponse {
  return typeof value === 'object' && value !== null && 'data' in value && 'panel' in value
}

const errorBodySchema = z.object({ error: z.string() })

function errorMessage(value: unknown, fallback: string): string {
  const parsed = errorBodySchema.safeParse(value)
  return parsed.success ? parsed.data.error : fallback
}

/**
 * Fetches one panel from `/api/analytics` whenever the request changes, dropping stale responses.
 * `pick` narrows the response to the panel's data shape; a mismatch is reported as an error.
 * Switching `panel` reads as loading at once, so a tabbed card never shows the old tab's rows.
 */
export function usePanel<T extends PanelData>(
  panel: AnalyticsPanel,
  request: PanelRequest,
  pick: (data: PanelData) => T | null,
  enabled = true,
): PanelState<T> {
  const [current, setCurrent] = useState<{ panel: AnalyticsPanel; state: PanelState<T> }>({
    panel,
    state: LOADING,
  })
  const { center, from, to, generation, force } = request

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const setState = (state: PanelState<T>) => setCurrent({ panel, state })
    setState(LOADING)

    const params = new URLSearchParams({ center, from, to, panel })
    if (force) params.set('refresh', '1')

    fetch(`/api/analytics?${params}`, { signal: controller.signal, credentials: 'include' })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null)
        if (!response.ok || !isPanelResponse(body)) {
          setState({ status: 'error', message: errorMessage(body, 'Could not load this panel') })
          return
        }
        const data = pick(body.data)
        setState(
          data
            ? { status: 'ready', data, range: body.range }
            : { status: 'error', message: 'Unexpected panel data' },
        )
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Request failed',
        })
      })

    return () => controller.abort()
  }, [center, from, to, panel, generation, force, enabled, pick])

  return current.panel === panel ? current.state : LOADING
}
