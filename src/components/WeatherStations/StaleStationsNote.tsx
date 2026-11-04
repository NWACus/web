import type { StaleStation } from '@/services/stations/staleStations'
import { WifiOff } from 'lucide-react'

function formatReport(iso: string, timeZone: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

export function StaleStationsNote({
  stale,
  timeZone,
}: {
  stale: StaleStation[]
  timeZone: string
}) {
  if (stale.length === 0) return null
  return (
    <ul className="flex flex-col gap-1">
      {stale.map(({ key, name, lastReported }) => (
        <li
          key={key}
          className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm"
        >
          <WifiOff className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium">{name}</span>{' '}
            <span className="text-muted-foreground">
              · Last report {formatReport(lastReported, timeZone)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
