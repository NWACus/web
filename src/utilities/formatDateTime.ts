import { TZDate, tzName } from '@date-fns/tz'
import { format } from 'date-fns/format'

export const formatDateTime = (
  dateString: string,
  tz: string | null | undefined,
  formatStr: string,
) => {
  const date = tz ? new TZDate(dateString, tz) : new Date(dateString)

  return tz && formatStr.includes('zzz')
    ? `${format(date, formatStr.replace(/zzz/g, ''))} ${tzName(tz, date, 'short')}`
    : format(date, formatStr)
}
