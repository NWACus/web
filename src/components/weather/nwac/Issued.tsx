/** Who issued a Mountain Weather issuance and when, in the center's timezone. */
import type { NWACWeatherIssuance } from '@/services/nac/model/nwacWeather'
import { formatDateTime } from '@/utilities/formatDateTime'

export function formatIssued(iso: string, timezone: string | null | undefined, pattern: string) {
  return isNaN(new Date(iso).getTime()) ? null : formatDateTime(iso, timezone, pattern)
}

/** The line under a Mountain Weather heading: the switch beside it already names the issuance. */
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
    <p className="text-muted-foreground">
      {issued && (
        <>
          Issued <span className="font-semibold text-foreground">{issued}</span>
        </>
      )}
      {issued && issuance.author && ' · '}
      {issuance.author}
    </p>
  )
}
