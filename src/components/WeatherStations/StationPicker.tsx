'use client'

import { NWAC_STATION_REGIONS, NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'

// Shared styling for every station select (padding varies per site).
export const stationSelectClass =
  'rounded-md border border-input bg-background text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring'

// Region-grouped station options, shared by every station select.
export function StationOptGroups({ excludeSlugs = [] }: { excludeSlugs?: string[] }) {
  return NWAC_STATION_REGIONS.map((region) => {
    const groups = NWAC_WEATHER_STATION_GROUPS.filter(
      (group) => group.region === region && !excludeSlugs.includes(group.slug),
    )
    if (groups.length === 0) return null
    return (
      <optgroup key={region} label={region}>
        {groups.map((group) => (
          <option key={group.slug} value={group.slug}>
            {group.displayName}
          </option>
        ))}
      </optgroup>
    )
  })
}

// Region-grouped dropdown that navigates to a station's page. Reused on both the
// stations index and the per-station detail page.
export function StationPicker({ current, className }: { current?: string; className?: string }) {
  const router = useRouter()

  return (
    <label className={cn('inline-flex items-center gap-2 text-sm', className)}>
      <span className="sr-only">Jump to a weather station</span>
      <select
        value={current ?? ''}
        onChange={(event) => {
          if (event.target.value) router.push(`/weather/stations/${event.target.value}`)
        }}
        className={cn(stationSelectClass, 'px-3 py-2')}
      >
        <option value="" disabled>
          Jump to a station…
        </option>
        <StationOptGroups />
      </select>
    </label>
  )
}
