import { Badge } from '@/components/ui/badge'
import type { StationTable } from '@/services/snowobs/tableHelpers'

const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000

export function StationLatestObservation({ table }: { table: StationTable }) {
  const isStale =
    table.latestObservation !== null && Date.now() - table.latestObservation > STALE_THRESHOLD_MS

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {table.latestDisplay ? (
        <span>
          Latest observation {table.latestDisplay}
          {table.timezoneLabel ? ` ${table.timezoneLabel}` : ''}
        </span>
      ) : (
        <span>No recent observations</span>
      )}
      {isStale && <Badge variant="destructive">Data may be stale</Badge>}
    </div>
  )
}
