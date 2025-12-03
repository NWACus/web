import { formatInTimeZone } from 'date-fns-tz'
import { format } from 'date-fns/format'

export const formatDateTime = (
  dateString: string,
  tz: string | null | undefined,
  options: string,
) => {
  return tz ? formatInTimeZone(dateString, tz, options) : format(dateString, options)
}
