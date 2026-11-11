'use client'

import {
  reportRangeSchema,
  type AnalyticsReport,
  type ReportRange,
} from '@/services/posthog/reportTypes'
import { useEffect, useState } from 'react'
import { z } from 'zod'

export type ReportRequest = {
  center: string
  from: string
  to: string
  /** Bumped by the Refresh button; `force` skips both caches once. */
  generation: number
  force: boolean
}

export type ReportState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T; range: ReportRange }

/** Turns a response's `data` into the report's shape, or null when it does not match. */
export type ReportParser<T> = (data: unknown) => T | null

export function parseWith<T>(schema: z.ZodType<T>): ReportParser<T> {
  return (data) => {
    const parsed = schema.safeParse(data)
    return parsed.success ? parsed.data : null
  }
}

const LOADING: { status: 'loading' } = { status: 'loading' }

const responseSchema = z.object({ range: reportRangeSchema, data: z.unknown() })
const errorBodySchema = z.object({ error: z.string() })

function errorMessage(value: unknown, fallback: string): string {
  const parsed = errorBodySchema.safeParse(value)
  return parsed.success ? parsed.data.error : fallback
}

function stateFromBody<T>(body: unknown, ok: boolean, parse: ReportParser<T>): ReportState<T> {
  const response = responseSchema.safeParse(body)
  if (!ok || !response.success) {
    return { status: 'error', message: errorMessage(body, 'Could not load this report') }
  }
  const data = parse(response.data.data)
  return data === null
    ? { status: 'error', message: 'Unexpected report data' }
    : { status: 'ready', data, range: response.data.range }
}

/**
 * Fetches one report from `/api/analytics` whenever the request changes, dropping stale responses.
 * `parse` must be stable (defined at module level). Switching `report` reads as loading at once.
 */
export function useReport<T>(
  report: AnalyticsReport,
  request: ReportRequest,
  parse: ReportParser<T>,
): ReportState<T> {
  const [current, setCurrent] = useState<{ report: AnalyticsReport; state: ReportState<T> }>({
    report,
    state: LOADING,
  })
  const { center, from, to, generation, force } = request

  useEffect(() => {
    const controller = new AbortController()
    const setState = (state: ReportState<T>) => setCurrent({ report, state })
    setState(LOADING)

    const params = new URLSearchParams({ center, from, to, report })
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
  }, [center, from, to, report, generation, force, parse])

  return current.report === report ? current.state : LOADING
}

/** A parser for a list report's `{ rows }`, validating each row with `rowSchema`. */
export function parseRows<Row>(rowSchema: z.ZodType<Row>): ReportParser<{ rows: Row[] }> {
  return parseWith(z.object({ rows: z.array(rowSchema) }))
}
