import { formatInTimeZone } from 'date-fns-tz'
import { format } from 'date-fns/format'

export const formatDateTime = (
  dateString: string,
  tz: string | null | undefined,
  options: string,
) => {
  return tz && tz.length > 0
    ? formatInTimeZone(dateString, tz, options)
    : format(dateString, options)
}
