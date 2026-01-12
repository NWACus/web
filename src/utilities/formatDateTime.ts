import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns/format'

export const formatDateTime = (
  dateString: string,
  tz: string | null | undefined,
  formatStr: string,
) => {
  return tz ? format(new TZDate(dateString, tz), formatStr) : format(dateString, formatStr)
}
