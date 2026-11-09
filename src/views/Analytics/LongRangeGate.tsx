'use client'

import { rangeDays, type DateRange } from '@/services/posthog/analyticsRange'
import { PROMPT_ABOVE_DAYS, type LoadEstimate } from '@/services/posthog/panelTypes'
import { cn } from '@/utilities/ui'
import { Button, ShimmerEffect } from '@payloadcms/ui'
import { useEffect, useState, type ReactNode } from 'react'
import { formatDateRange } from './format'
import { MUTED } from './panels/Panel'

type GateState = { status: 'checking' } | { status: 'open' } | { status: 'ask'; seconds: number }

export function describeSeconds(seconds: number): string {
  if (seconds < 55) return `about ${Math.max(10, Math.round(seconds / 10) * 10)} seconds`
  const minutes = Math.round(seconds / 60)
  return minutes <= 1 ? 'about a minute' : `about ${minutes} minutes`
}

function isEstimate(value: unknown): value is LoadEstimate {
  return typeof value === 'object' && value !== null && 'cached' in value && 'seconds' in value
}

/**
 * Long ranges take a while to load cold, so before the panels fetch, ask the server whether the
 * range is already warm and otherwise let the reader choose to wait or step back.
 */
export function LongRangeGate({
  center,
  range,
  onFallback,
  children,
}: {
  center: string
  range: DateRange
  onFallback: () => void
  children: ReactNode
}) {
  const needsCheck = rangeDays(range) > PROMPT_ABOVE_DAYS
  const [state, setState] = useState<GateState>(
    needsCheck ? { status: 'checking' } : { status: 'open' },
  )
  const [confirmed, setConfirmed] = useState<string | null>(null)
  const key = `${range.from}|${range.to}`

  useEffect(() => {
    if (!needsCheck || confirmed === key) {
      setState({ status: 'open' })
      return
    }
    const controller = new AbortController()
    setState({ status: 'checking' })
    fetch(
      `/api/analytics/estimate?${new URLSearchParams({ center, from: range.from, to: range.to })}`,
      {
        signal: controller.signal,
        credentials: 'include',
      },
    )
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null)
        const estimate = isEstimate(body) ? body : { cached: false, seconds: 60 }
        setState(
          estimate.cached ? { status: 'open' } : { status: 'ask', seconds: estimate.seconds },
        )
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'open' })
      })
    return () => controller.abort()
  }, [center, range.from, range.to, needsCheck, confirmed, key])

  if (state.status === 'open') return <>{children}</>

  if (state.status === 'checking') {
    return (
      <div className="card flex-col gap-3" aria-busy>
        <ShimmerEffect height="1rem" width="40%" />
        <p className={cn('m-0 text-sm', MUTED)}>Checking whether this range is already loaded…</p>
      </div>
    )
  }

  return (
    <div className="card flex-col gap-4">
      <p className="m-0 text-sm">
        Nothing is loaded yet for {formatDateRange(range.from, range.to)}. Pulling this range from
        PostHog takes {describeSeconds(state.seconds)} the first time, then stays quick for a while.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          buttonStyle="primary"
          size="small"
          className="m-0"
          onClick={() => setConfirmed(key)}
        >
          Load it
        </Button>
        <Button buttonStyle="secondary" size="small" className="m-0" onClick={onFallback}>
          Back to last 30 days
        </Button>
      </div>
    </div>
  )
}
