'use client'

import { STATION_REGIONS, WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'

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
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="" disabled>
          Jump to a station…
        </option>
        {STATION_REGIONS.map((region) => {
          const groups = WEATHER_STATION_GROUPS.filter((group) => group.region === region)
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
        })}
      </select>
    </label>
  )
}
