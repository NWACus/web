'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NWAC_STATION_REGIONS, NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'

// Overrides on the shadcn SelectTrigger that keep the native-select look:
// soft corners, subtle shadow, content-sized, no focus-ring offset.
export const stationSelectTriggerClass =
  'h-auto w-auto gap-2 rounded-md text-sm shadow-sm focus:ring-offset-0'

export function StationSelectGroups({ excludeSlugs = [] }: { excludeSlugs?: string[] }) {
  return NWAC_STATION_REGIONS.map((region) => {
    const groups = NWAC_WEATHER_STATION_GROUPS.filter(
      (group) => group.region === region && !excludeSlugs.includes(group.slug),
    )
    if (groups.length === 0) return null
    return (
      <SelectGroup key={region}>
        <SelectLabel className="pl-2 font-normal text-muted-foreground">{region}</SelectLabel>
        {groups.map((group) => (
          <SelectItem key={group.slug} value={group.slug}>
            {group.displayName}
          </SelectItem>
        ))}
      </SelectGroup>
    )
  })
}

// Region-grouped dropdown that navigates to a station's page. Reused on both the
// stations index and the per-station detail page.
export function StationPicker({ current, className }: { current?: string; className?: string }) {
  const router = useRouter()

  return (
    <Select
      value={current ?? ''}
      onValueChange={(slug) => router.push(`/weather/stations/${slug}`)}
    >
      <SelectTrigger
        aria-label="Jump to a weather station"
        className={cn(stationSelectTriggerClass, 'min-w-48', className)}
      >
        {/* Static label: the page already shows the station name, and long
            names balloon the trigger. The list still checkmarks the current
            station via the Select value. */}
        <SelectValue placeholder="Jump to a station…">Jump to a station…</SelectValue>
      </SelectTrigger>
      <SelectContent position="item-aligned">
        <StationSelectGroups />
      </SelectContent>
    </Select>
  )
}
