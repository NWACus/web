import { TZDate } from '@date-fns/tz'

export const US_TIMEZONES = {
  EASTERN: 'America/New_York',
  MOUNTAIN: 'America/Denver',
  PACIFIC: 'America/Los_Angeles',
  ARIZONA: 'America/Phoenix',
  ALASKA: 'America/Anchorage',
  HAWAII: 'Pacific/Honolulu',
} as const

export type USTimezone = (typeof US_TIMEZONES)[keyof typeof US_TIMEZONES]

export const TIMEZONE_OPTIONS = [
  { label: 'Eastern Time (ET)', value: US_TIMEZONES.EASTERN },
  { label: 'Mountain Time (MT)', value: US_TIMEZONES.MOUNTAIN },
  { label: 'Pacific Time (PT)', value: US_TIMEZONES.PACIFIC },
  // Arizona does not observe DST, so it is Mountain Standard Time year-round rather than America/Denver.
  { label: 'Arizona Time (MST)', value: US_TIMEZONES.ARIZONA },
  { label: 'Alaska Time (AKT)', value: US_TIMEZONES.ALASKA },
  { label: 'Island Time (HT)', value: US_TIMEZONES.HAWAII },
]

/**
 * Whether two IANA zones put a given instant at the same wall clock time.
 *
 * Comparing identifiers is not enough: `America/Boise` and `America/Denver` are distinct names
 * that never disagree, so a Boise editor is not really in a different timezone from a Mountain
 * center. The instant matters too, since `America/Phoenix` matches `America/Denver` in winter
 * but not in summer.
 */
export const timezonesAgreeAt = (a: string, b: string, instant: Date): boolean =>
  new TZDate(instant, a).getTimezoneOffset() === new TZDate(instant, b).getTimezoneOffset()
