/** Who issued a Mountain Weather issuance and when, in the center's timezone, not the reader's. */
import type { NWACWeatherIssuance } from '@/services/nac/model/nwacWeather'
import { formatDateTime } from '@/utilities/formatDateTime'

export function formatIssued(iso: string, timezone: string | null | undefined, pattern: string) {
  return isNaN(new Date(iso).getTime()) ? null : formatDateTime(iso, timezone, pattern)
}

/** Who issued the forecast and when, the line under a Mountain Weather heading. */
export function IssuedMeta({
  issuance,
  timezone,
}: {
  issuance: NWACWeatherIssuance
  timezone: string | null | undefined
}) {
  const issued = formatIssued(issuance.issuedAt, timezone, "EEE, MMM d 'at' h:mm a zzz")
  if (!issued && !issuance.author) return null
  return (
    <p className="text-sm text-muted-foreground">
      {issued && <>Issued {issued}</>}
      {issuance.author && (
        <>
          {issued ? ' by ' : 'By '}
          {issuance.author}
        </>
      )}
    </p>
  )
}
