import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import { WifiOff } from 'lucide-react'

export function StationLastReport({
  lastReport,
  timeZone,
}: {
  lastReport: string
  timeZone: string
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-px text-xs text-muted-foreground">
      <WifiOff className="h-3.5 w-3.5" aria-hidden />
      Last report {format(new Date(lastReport), 'MMM d, yyyy', { in: tz(timeZone) })}
    </span>
  )
}
