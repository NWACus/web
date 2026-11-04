import type { StaleStation } from '@/services/stations/staleStations'

// Says why a station's columns or graph lines are empty.
export function StaleStationsNote({
  stale,
  timeZone,
}: {
  stale: StaleStation[]
  timeZone: string
}) {
  if (stale.length === 0) return null
  const format = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  })
  return (
    <ul className="text-sm text-muted-foreground">
      {stale.map(({ name, lastReported }) => (
        <li key={name}>
          {name} last reported {format.format(new Date(lastReported))}.
        </li>
      ))}
    </ul>
  )
}
