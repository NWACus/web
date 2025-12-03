export const US_TIMEZONES = {
  EASTERN: 'America/New_York',
  MOUNTAIN: 'America/Denver',
  PACIFIC: 'America/Los_Angeles',
  ALASKA: 'America/Anchorage',
  HAWAII: 'America/Honolulu',
} as const

export type USTimezone = (typeof US_TIMEZONES)[keyof typeof US_TIMEZONES]

export const TIMEZONE_OPTIONS = [
  { label: 'Eastern Time (ET)', value: US_TIMEZONES.EASTERN },
  { label: 'Mountain Time (MT)', value: US_TIMEZONES.MOUNTAIN },
  { label: 'Pacific Time (PT)', value: US_TIMEZONES.PACIFIC },
  { label: 'Alaska Time (AKT)', value: US_TIMEZONES.ALASKA },
  { label: 'Island Time (HT)', value: US_TIMEZONES.HAWAII },
]
