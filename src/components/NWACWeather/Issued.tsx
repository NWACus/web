/** An issuance's time of day ("2:30 PM") in the center's timezone; null for a bad timestamp. */
import { formatDateTime } from '@/utilities/formatDateTime'

export function issueTime(iso: string, timezone: string | null | undefined): string | null {
  return isNaN(new Date(iso).getTime()) ? null : formatDateTime(iso, timezone, 'h:mm a')
}
