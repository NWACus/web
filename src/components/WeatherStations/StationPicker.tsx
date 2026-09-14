'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StationPageSummary } from '@/services/stations/getStationPages'
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'

// Restores the native-select look on the shadcn SelectTrigger.
export const stationSelectTriggerClass =
  'h-auto w-auto gap-2 rounded-md text-sm shadow-sm focus:ring-offset-0'

// Every page as an option, alphabetical, minus the ones a caller rules out.
export function StationSelectGroups({
  pages,
  excludeSlugs = [],
  excludeArchived = false,
}: {
  pages: StationPageSummary[]
  excludeSlugs?: string[]
  excludeArchived?: boolean
}) {
  const listed = pages.filter(
    (page) => !excludeSlugs.includes(page.slug) && !(excludeArchived && page.archived),
  )
  return listed.map((page) => (
    <SelectItem key={page.slug} value={page.slug}>
      {page.displayName}
    </SelectItem>
  ))
}

// Dropdown that navigates to a station's page. Reused on both the
// stations index and the per-station detail page.
export function StationPicker({
  pages,
  current,
  className,
}: {
  pages: StationPageSummary[]
  current?: string
  className?: string
}) {
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
        <StationSelectGroups pages={pages} />
      </SelectContent>
    </Select>
  )
}
