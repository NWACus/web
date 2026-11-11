'use client'

import {
  panelRangeSchema,
  type AnalyticsPanel,
  type PanelRange,
} from '@/services/posthog/panelTypes'
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

export type PanelState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T; range: PanelRange }

/** Turns a response's `data` into the panel's shape, or null when it does not match. */
export type PanelParser<T> = (data: unknown) => T | null

export function parseWith<T>(schema: z.ZodType<T>): PanelParser<T> {
  return (data) => {
    const parsed = schema.safeParse(data)
    return parsed.success ? parsed.data : null
  }
}

const LOADING: { status: 'loading' } = { status: 'loading' }

const responseSchema = z.object({ range: panelRangeSchema, data: z.unknown() })
const errorBodySchema = z.object({ error: z.string() })

function errorMessage(value: unknown, fallback: string): string {
  const parsed = errorBodySchema.safeParse(value)
  return parsed.success ? parsed.data.error : fallback
}

function stateFromBody<T>(body: unknown, ok: boolean, parse: PanelParser<T>): PanelState<T> {
  const response = responseSchema.safeParse(body)
  if (!ok || !response.success) {
    return { status: 'error', message: errorMessage(body, 'Could not load this panel') }
  }
  const data = parse(response.data.data)
  return data === null
    ? { status: 'error', message: 'Unexpected panel data' }
    : { status: 'ready', data, range: response.data.range }
}

/**
 * Fetches one panel from `/api/analytics` whenever the request changes, dropping stale responses.
 * `parse` must be stable (defined at module level). Switching `panel` reads as loading at once.
 */
export function usePanel<T>(
  panel: AnalyticsPanel,
  request: PanelRequest,
  parse: PanelParser<T>,
): PanelState<T> {
  const [current, setCurrent] = useState<{ panel: AnalyticsPanel; state: PanelState<T> }>({
    panel,
    state: LOADING,
  })
  const { center, from, to, generation, force } = request

  useEffect(() => {
    const controller = new AbortController()
    const setState = (state: PanelState<T>) => setCurrent({ panel, state })
    setState(LOADING)

    const params = new URLSearchParams({ center, from, to, panel })
    if (force) params.set('refresh', '1')

    fetch(`/api/analytics?${params}`, { signal: controller.signal, credentials: 'include' })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null)
        setState(stateFromBody(body, response.ok, parse))
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Request failed',
        })
      })

    return () => controller.abort()
  }, [center, from, to, panel, generation, force, parse])

  return current.panel === panel ? current.state : LOADING
}

/** A parser for a list panel's `{ rows }`, validating each row with `rowSchema`. */
export function parseRows<Row>(rowSchema: z.ZodType<Row>): PanelParser<{ rows: Row[] }> {
  return parseWith(z.object({ rows: z.array(rowSchema) }))
}
