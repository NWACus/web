import { Badge } from '@/components/ui/badge'
import type { LatestObservation } from '@/services/snowobs/tableHelpers'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000

export function StationLatestObservation({
  table,
  className,
}: {
  table: LatestObservation
  className?: string
}) {
  const isStale =
    table.latestObservation !== null && Date.now() - table.latestObservation > STALE_THRESHOLD_MS

  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      {table.latestDisplay ? (
        <span className={cn(isStale && 'text-destructive sm:text-muted-foreground')}>
          Last updated {table.latestDisplay}
          {table.timezoneLabel ? ` ${table.timezoneLabel}` : ''}
        </span>
      ) : (
        <span>No recent observations</span>
      )}
      {isStale && (
        <Badge variant="destructive" className="hidden sm:inline-flex">
          Data may be stale
        </Badge>
      )}
    </div>
  )
}

// Sits in the tab row's empty end, so it costs no line of its own; on a phone it wraps to fit.
export function TabsWithLatest({
  tabs,
  latest,
}: {
  tabs: ReactNode
  latest: LatestObservation | null
}) {
  return (
    <div className="relative">
      {tabs}
      {latest && (
        <StationLatestObservation
          table={latest}
          className="absolute inset-y-0 right-0 max-w-24 text-right leading-tight sm:max-w-none"
        />
      )}
    </div>
  )
}
