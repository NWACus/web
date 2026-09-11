'use client'

/**
 * The archive browser's date filter: a season to browse, and a start/end date within it. The
 * legacy widget offers the same two controls (a season select and a day-range slider over that
 * season); here the range is two calendar pickers, bounded to the season and to each other.
 *
 * Writes the URL and lets the server re-render the list (`shallow: false`), so a filtered view is
 * a shareable address. Changing the season clears the range, which then falls back to that
 * season's defaults.
 */
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useId, useState } from 'react'

import { FilterSection } from '@/components/filters/FilterSection'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatArchiveDate } from '@/services/nac/forecastArchive'

import { archiveSearchParams } from './archiveSearchParams'

export interface ArchiveDateFilterProps {
  seasons: { value: number; label: string }[]
  season: number
  currentSeason: number
  /** The whole season, as `yyyy-MM-dd`. */
  window: { from: string; to: string }
  /** The range shown. */
  from: string
  to: string
  /** The range the season falls back to when the URL carries none. */
  defaultRange: { from: string; to: string }
}

const {
  season: seasonParser,
  from: fromParser,
  to: toParser,
  page: pageParser,
} = archiveSearchParams

export function ArchiveDateFilter({
  seasons,
  season,
  currentSeason,
  window,
  from,
  to,
  defaultRange,
}: ArchiveDateFilterProps) {
  const [, setParams] = useQueryStates(
    { season: seasonParser, from: fromParser, to: toParser, page: pageParser },
    { shallow: false, history: 'push' },
  )
  // This filter renders twice on the page — in the sidebar and again in the mobile drawer, which
  // stays mounted — so a fixed id is duplicated, and every label's `for` then binds to whichever
  // copy comes first in the document, leaving the visible control unlabelled and its label inert.
  const idPrefix = useId()

  const selectSeason = (value: string) => {
    const next = Number(value)
    setParams({ season: next === currentSeason ? null : next, from: null, to: null, page: null })
  }

  return (
    <FilterSection title="Date" defaultOpen>
      <div className="flex flex-col gap-4 pb-4">
        <SeasonSelect
          id={`${idPrefix}season`}
          seasons={seasons}
          season={season}
          onChange={selectSeason}
        />
        <div className="flex gap-3">
          <ArchiveDateField
            id={`${idPrefix}from`}
            label="Start date"
            value={from}
            min={window.from}
            max={to}
            onChange={(date) =>
              setParams({ from: date === defaultRange.from ? null : date, page: null })
            }
          />
          <ArchiveDateField
            id={`${idPrefix}to`}
            label="End date"
            value={to}
            min={from}
            max={defaultRange.to}
            onChange={(date) =>
              setParams({ to: date === defaultRange.to ? null : date, page: null })
            }
          />
        </div>
      </div>
    </FilterSection>
  )
}

function SeasonSelect({
  id,
  seasons,
  season,
  onChange,
}: {
  id: string
  seasons: { value: number; label: string }[]
  season: number
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        Season
      </Label>
      <Select value={String(season)} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label="Season">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {seasons.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** One end of the range: a button showing the date, opening a calendar bounded to `min`..`max`. */
function ArchiveDateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string
  label: string
  /** `yyyy-MM-dd` */
  value: string
  min: string
  max: string
  onChange: (date: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = parseISO(value)

  const handleSelect = (date: Date | undefined) => {
    if (date) onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div className="flex w-1/2 flex-col gap-1">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id={id} className="w-full justify-between px-2 font-normal">
            {formatArchiveDate(value)}
            <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            startMonth={parseISO(min)}
            endMonth={parseISO(max)}
            disabled={{ before: parseISO(min), after: parseISO(max) }}
            captionLayout="dropdown"
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
