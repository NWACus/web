import { Badge } from '@/components/ui/badge'
import type { StationTable } from '@/services/snowobs/transform'

const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000

// CRAP is inflated by the lack of unit coverage on this component.
// fallow-ignore-next-line complexity
export function StationLatestObservation({ table }: { table: StationTable }) {
  const latest = table.rows[0]
  const isStale =
    table.latestObservation !== null && Date.now() - table.latestObservation > STALE_THRESHOLD_MS

  return (
    <div className="mb-1 text-xs text-muted-foreground">
      {latest ? (
        <span>
          Latest observation {latest.display}
          {table.timezoneLabel ? ` ${table.timezoneLabel}` : ''}
        </span>
      ) : (
        <span>No recent observations</span>
      )}
      {isStale && <Badge variant="destructive">Data may be stale</Badge>}
    </div>
  )
}
