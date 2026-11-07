'use client'

import { useIsNarrowViewport } from '@/components/charts/useIsNarrowViewport'
import { seasonBounds, seasonName, seasonOfMonth } from '@/components/seasonCalendar'
import type { RailSection } from '@/components/SeasonRail'
import { SeasonRail } from '@/components/SeasonRail'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { CalendarDays, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { forwardRef, useEffect, useState } from 'react'
import type { DateRange as DayPickerRange } from 'react-day-picker'
import type { DateRange, StationPeriod } from './stationPeriods'
import {
  formatRangeLabel,
  presetRange,
  stationSeasons,
  todayInZone,
  toIsoDate,
} from './stationPeriods'
import {
  applicableRange,
  FIELD_FORMAT,
  nextDraft,
  parseTyped,
  selectableBounds,
  toDraft,
  withinSeason,
} from './stationRangeDraft'

/** The offered season a range covers exactly, if any. */
function matchingSeason(range: DateRange | null, today: string): number | null {
  const covers = (season: number) => {
    const bounds = seasonBounds(season, today)
    return range?.from === bounds.from && range.to === bounds.to
  }
  return stationSeasons(today).find(covers) ?? null
}

// Opens on the end of the range, so a recent one lands on today and one straddling two seasons,
// like 30 days in early September, opens on the newer season.
function monthToShow(draft: DayPickerRange | undefined, today: Date): Date {
  return draft?.to ?? draft?.from ?? today
}

function RangeCalendar({
  draft,
  onDraftChange,
  month,
  onMonthChange,
  maxDays,
  season,
  today,
}: {
  draft: DayPickerRange | undefined
  onDraftChange: (draft: DayPickerRange) => void
  month: Date
  onMonthChange: (month: Date) => void
  maxDays: number
  season: DateRange
  today: Date
}) {
  const { earliest, latest } = selectableBounds(draft, season, maxDays)
  return (
    <Calendar
      mode="range"
      selected={draft}
      onSelect={(_range, day) => onDraftChange(nextDraft(draft, day))}
      month={month}
      onMonthChange={onMonthChange}
      startMonth={parseISO(season.from)}
      endMonth={parseISO(season.to)}
      disabled={{ before: earliest, after: latest }}
      // Marks today in the center's zone, the last day that can be picked.
      today={today}
      captionLayout="dropdown"
      showOutsideDays={false}
      // The date fields below are wider than the calendar's natural size.
      classNames={{ root: 'w-full' }}
    />
  )
}

/**
 * Shows a date as "Oct 10, 2026". A typed date updates the draft on blur, so a reader can tab on
 * to the other end, and applies a complete range on Enter.
 */
function DateField({
  label,
  value,
  season,
  onChange,
}: {
  label: string
  value: Date | undefined
  season: DateRange
  onChange: (date: Date, apply: boolean) => void
}) {
  const shown = value ? format(value, FIELD_FORMAT) : ''
  const [text, setText] = useState(shown)
  useEffect(() => setText(shown), [shown])

  const commit = (apply: boolean) => {
    const date = parseTyped(text)
    const iso = date && toIsoDate(date)
    if (date && iso && iso >= season.from && iso <= season.to) onChange(date, apply)
    else setText(shown)
  }

  return (
    <Input
      type="text"
      aria-label={label}
      placeholder="Oct 1, 2026"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => commit(false)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit(true)
      }}
      className="h-8 w-28 px-1.5 text-center text-sm"
    />
  )
}

function RangeFields({
  draft,
  season,
  maxDays,
  crossesSeasons,
  onFromChange,
  onToChange,
}: {
  draft: DayPickerRange | undefined
  season: DateRange
  maxDays: number
  crossesSeasons: boolean
  onFromChange: (date: Date, apply: boolean) => void
  onToChange: (date: Date, apply: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <div className="flex items-center justify-center gap-1.5">
        <DateField label="Start date" value={draft?.from} season={season} onChange={onFromChange} />
        <span aria-hidden="true">–</span>
        <DateField label="End date" value={draft?.to} season={season} onChange={onToChange} />
      </div>
      {/* Typed dates can overshoot the cap the calendar greys out, so say why nothing applied. */}
      {draft?.from && draft.to && differenceInCalendarDays(draft.to, draft.from) >= maxDays && (
        <p role="alert" className="text-xs text-destructive">
          Pick a range of up to {maxDays} days.
        </p>
      )}
      {crossesSeasons && (
        <p role="alert" className="text-xs text-destructive">
          Pick dates within one season.
        </p>
      )}
    </div>
  )
}

// The draft opens on the range in view and is applied when an edit completes it (a second
// calendar click, or Enter in a date field), so an untouched preset never turns into the whole
// days it touches.
function useRangeDraft({
  value,
  today,
  maxDays,
  onComplete,
}: {
  value: DateRange | null
  today: Date
  maxDays: number
  onComplete: (range: DateRange) => void
}) {
  const [draft, setDraftState] = useState(() => toDraft(value))
  const [month, setMonth] = useState(() => monthToShow(toDraft(value), today))
  const [crossesSeasons, setCrossesSeasons] = useState(false)
  const season = seasonBounds(seasonOfMonth(month), toIsoDate(today))
  const edit = (next: DayPickerRange, apply = true) => {
    setDraftState(next)
    setCrossesSeasons(apply && !!next.to && !withinSeason(next, season))
    const range = apply && next.to ? applicableRange(next, maxDays, season) : null
    if (range) onComplete(range)
  }
  const reset = () => {
    const next = toDraft(value)
    setDraftState(next)
    setCrossesSeasons(false)
    setMonth(monthToShow(next, today))
  }
  const setFrom = (from: Date, apply: boolean) => {
    edit({ from, to: draft?.to && draft.to >= from ? draft.to : undefined }, apply)
    setMonth(from)
  }
  const setTo = (to: Date, apply: boolean) => {
    edit({ from: draft?.from && draft.from <= to ? draft.from : to, to }, apply)
    setMonth(to)
  }
  return { draft, edit, month, season, crossesSeasons, setMonth, reset, setFrom, setTo }
}

const RangeButton = forwardRef<HTMLButtonElement, ButtonProps & { label: string }>(
  function RangeButton({ label, ...props }, ref) {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        aria-label={`Date range: ${label}`}
        className="gap-1.5 whitespace-nowrap font-normal"
        {...props}
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {label}
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </Button>
    )
  },
)

function RangeBody({
  sections,
  range,
  maxDays,
  todayIso,
}: {
  sections: RailSection[]
  range: ReturnType<typeof useRangeDraft>
  maxDays: number
  todayIso: string
}) {
  return (
    <>
      <SeasonRail label="Ranges and seasons" sections={sections} />
      <div className="flex flex-col items-center sm:items-stretch">
        <RangeCalendar
          draft={range.draft}
          onDraftChange={(next) => range.edit(next)}
          month={range.month}
          onMonthChange={range.setMonth}
          maxDays={maxDays}
          season={range.season}
          today={parseISO(todayIso)}
        />
        <RangeFields
          draft={range.draft}
          season={range.season}
          maxDays={maxDays}
          crossesSeasons={range.crossesSeasons}
          onFromChange={range.setFrom}
          onToChange={range.setTo}
        />
      </div>
    </>
  )
}

type ShellProps = {
  align: 'start' | 'center'
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  children: ReactNode
}

function RangeDialog({ open, onOpenChange, label, children }: Omit<ShellProps, 'align'>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <RangeButton label={label} />
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] gap-0 overflow-y-auto rounded-lg p-0">
        <DialogTitle className="px-4 pb-2 pt-4 text-base">Date range</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function RangePopover({ align, open, onOpenChange, label, children }: ShellProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <RangeButton label={label} />
      </PopoverTrigger>
      {/* Room below never counts as a collision, so the popover always opens below the button
          instead of flipping with scroll position, while still shifting sideways to stay on screen. */}
      <PopoverContent
        className="grid w-auto auto-cols-auto grid-flow-col p-0"
        side="bottom"
        align={align}
        collisionPadding={{ top: 8, right: 8, bottom: -Infinity, left: 8 }}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

/**
 * A button naming the range in view (a range's name, a season, or custom dates) that opens the
 * ranges and seasons beside a calendar of one season. Custom dates are whole days in the center's
 * zone, inside one season, applied as soon as both ends are picked or typed.
 */
export function StationRangePicker({
  periods,
  activePeriod,
  custom,
  onSelectPeriod,
  onApplyCustom,
  maxDays,
  timeZone,
  align = 'center',
  className,
}: {
  /** The quick ranges listed in the rail. */
  periods: StationPeriod[]
  activePeriod: StationPeriod
  custom: DateRange | null
  onSelectPeriod: (key: string) => void
  onApplyCustom: (range: DateRange) => void
  maxDays: number
  timeZone: string
  /** Where the popover lines up with the button on wider screens. */
  align?: 'start' | 'center'
  className?: string
}) {
  const narrow = useIsNarrowViewport()
  const now = new Date()
  const todayIso = todayInZone(now, timeZone)
  const [open, setOpen] = useState(false)
  const range = useRangeDraft({
    value: custom ?? presetRange(activePeriod, timeZone, now),
    today: parseISO(todayIso),
    maxDays,
    onComplete: (completed) => {
      onApplyCustom(completed)
      setOpen(false)
    },
  })

  const changeOpen = (next: boolean) => {
    if (next) range.reset()
    setOpen(next)
  }
  const activeSeason = matchingSeason(custom, todayIso)
  const sections: RailSection[] = [
    {
      title: 'Ranges',
      items: periods.map((period) => ({
        key: period.key,
        label: period.label,
        active: !custom && period.key === activePeriod.key,
        onSelect: () => {
          onSelectPeriod(period.key)
          setOpen(false)
        },
      })),
    },
    {
      title: 'Seasons',
      items: stationSeasons(todayIso).map((season) => ({
        key: String(season),
        label: seasonName(season),
        active: season === activeSeason,
        onSelect: () => {
          onApplyCustom(seasonBounds(season, todayIso))
          setOpen(false)
        },
      })),
    },
  ]
  const customLabel = (range: DateRange) =>
    activeSeason ? seasonName(activeSeason) : formatRangeLabel(range)
  const label = custom ? customLabel(custom) : activePeriod.label
  const body = <RangeBody sections={sections} range={range} maxDays={maxDays} todayIso={todayIso} />

  // A phone has no room for a popover beside the button, so the picker opens as a dialog.
  const Shell = narrow ? RangeDialog : RangePopover
  return (
    <div className={className}>
      <Shell align={align} open={open} onOpenChange={changeOpen} label={label}>
        {body}
      </Shell>
    </div>
  )
}
