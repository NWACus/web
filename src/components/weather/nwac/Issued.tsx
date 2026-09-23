/**
 * Who issued a Mountain Weather issuance and when, in the center's timezone (the page is
 * server-rendered, so there is no reader locale to fall back on).
 */
import type { NwacWeatherIssuance } from '@/services/nac/model/nwacWeather'
import { issuanceLabel } from '@/services/nac/nwacWeatherFormat'
import { formatDateTime } from '@/utilities/formatDateTime'

export function formatIssued(iso: string, timezone: string | null | undefined, pattern: string) {
  return isNaN(new Date(iso).getTime()) ? null : formatDateTime(iso, timezone, pattern)
}

export function IssuedLine({
  issuance,
  timezone,
}: {
  issuance: NwacWeatherIssuance
  timezone: string | null | undefined
}) {
  const issued = formatIssued(issuance.issuedAt, timezone, "EEE, MMM d 'at' h:mm a zzz")
  return (
    <p className="text-sm text-muted-foreground">
      {issuanceLabel(issuance.type)}
      {issued && (
        <>
          {' · Issued '}
          <span className="font-medium text-foreground">{issued}</span>
        </>
      )}
      {issuance.author && <> by {issuance.author}</>}
    </p>
  )
}
