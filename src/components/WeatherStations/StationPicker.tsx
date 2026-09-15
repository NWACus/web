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
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'
import { useStationRegistry } from './useStationRegistry'

// Restores the native-select look on the shadcn SelectTrigger.
export const stationSelectTriggerClass =
  'h-auto w-auto gap-2 rounded-md text-sm shadow-sm focus:ring-offset-0'

export function StationSelectGroups({
  excludeSlugs = [],
  excludeArchived = false,
}: {
  excludeSlugs?: string[]
  excludeArchived?: boolean
}) {
  const registry = useStationRegistry()
  if (!registry) return null
  return registry.regions.map((region) => {
    const groups = registry.groups.filter(
      (group) =>
        group.region === region &&
        !excludeSlugs.includes(group.slug) &&
        !(excludeArchived && group.archived),
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
        {/* Static label — long station names balloon the trigger otherwise. */}
        <SelectValue placeholder="Jump to a station…">Jump to a station…</SelectValue>
      </SelectTrigger>
      <SelectContent position="item-aligned">
        <StationSelectGroups />
      </SelectContent>
    </Select>
  )
}
