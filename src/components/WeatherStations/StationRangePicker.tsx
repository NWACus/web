'use client'

import { useIsNarrowViewport } from '@/components/charts/useIsNarrowViewport'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utilities/ui'
import { addDays, format, isValid, max, min, parse, parseISO, subDays, subMonths } from 'date-fns'
import { CalendarDays, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { DateRange as DayPickerRange } from 'react-day-picker'
import type { DateRange, StationPeriod } from './stationPeriods'
import {
  EARLIEST_CUSTOM_DATE,
  formatRangeLabel,
  presetRange,
  rangeDays,
  todayInZone,
} from './stationPeriods'

type PeriodTarget = {
  /** Link target for a preset; without it presets call onSelectPeriod. */
  periodHref?: (key: string) => string
  onSelectPeriod?: (key: string) => void
}

function toDraft(range: DateRange | null): DayPickerRange | undefined {
  return range ? { from: parseISO(range.from), to: parseISO(range.to) } : undefined
}

function toIso(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// The first click picks the start, the second the end (either order); a third starts over.
// DayPicker's own rule closes the range on the first click, which reads as a one-day pick.
function nextDraft(draft: DayPickerRange | undefined, day: Date): DayPickerRange {
  if (!draft?.from || draft.to) return { from: day, to: undefined }
  return day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day }
}

// Once a start is picked, days that would push the range past `maxDays` go grey.
function selectableBounds(draft: DayPickerRange | undefined, today: Date, maxDays: number) {
  const earliest = parseISO(EARLIEST_CUSTOM_DATE)
  if (!draft?.from || draft.to) return { earliest, latest: today }
  return {
    earliest: max([earliest, subDays(draft.from, maxDays - 1)]),
    latest: min([today, addDays(draft.from, maxDays - 1)]),
  }
}

/** The draft as a range to apply, or null when it is incomplete or out of bounds. */
function applicableRange(
  draft: DayPickerRange | undefined,
  maxDays: number,
  today: string,
): DateRange | null {
  if (!draft?.from) return null
  const range = { from: toIso(draft.from), to: toIso(draft.to ?? draft.from) }
  const inBounds = range.from >= EARLIEST_CUSTOM_DATE && range.to <= today
  return inBounds && range.from <= range.to && rangeDays(range) <= maxDays ? range : null
}

function PeriodList({
  periods,
  activeKey,
  target,
  onPicked,
}: {
  periods: StationPeriod[]
  activeKey: string | null
  target: PeriodTarget
  onPicked: () => void
}) {
  const itemClass = (key: string) =>
    cn(
      'whitespace-nowrap rounded-md px-3 py-1.5 text-left text-sm hover:bg-muted',
      key === activeKey && 'bg-muted font-medium',
    )
  return (
    <nav
      aria-label="Preset ranges"
      className="flex gap-1 overflow-x-auto border-b p-2 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r"
    >
      {periods.map((period) =>
        target.periodHref ? (
          <Link
            key={period.key}
            href={target.periodHref(period.key)}
            scroll={false}
            onClick={onPicked}
            className={itemClass(period.key)}
          >
            {period.label}
          </Link>
        ) : (
          <button
            key={period.key}
            type="button"
            onClick={() => {
              target.onSelectPeriod?.(period.key)
              onPicked()
            }}
            className={itemClass(period.key)}
          >
            {period.label}
          </button>
        ),
      )}
    </nav>
  )
}

function RangeCalendar({
  draft,
  onDraftChange,
  month,
  onMonthChange,
  maxDays,
  today,
}: {
  draft: DayPickerRange | undefined
  onDraftChange: (draft: DayPickerRange) => void
  month: Date
  onMonthChange: (month: Date) => void
  maxDays: number
  today: Date
}) {
  const narrow = useIsNarrowViewport()
  const { earliest, latest } = selectableBounds(draft, today, maxDays)
  return (
    <Calendar
      mode="range"
      selected={draft}
      onSelect={(_range, day) => onDraftChange(nextDraft(draft, day))}
      numberOfMonths={narrow ? 1 : 2}
      month={month}
      onMonthChange={onMonthChange}
      startMonth={parseISO(EARLIEST_CUSTOM_DATE)}
      endMonth={today}
      disabled={{ before: earliest, after: latest }}
      captionLayout="dropdown"
      // Two months side by side would otherwise highlight the same days twice.
      showOutsideDays={false}
    />
  )
}

const FIELD_FORMAT = 'MMM d, yyyy'
// Typed dates: the field's own format, then numeric US and ISO dates.
const TYPED_FORMATS = [FIELD_FORMAT, 'MMM d yyyy', 'M/d/yyyy', 'yyyy-MM-dd', 'MMM d, yy', 'M/d/yy']

function parseTyped(text: string): Date | null {
  const trimmed = text.trim()
  for (const pattern of TYPED_FORMATS) {
    const date = parse(trimmed, pattern, new Date())
    // A `yyyy` pattern reads "26" as the year 26, so leave short years to the `yy` patterns.
    if (isValid(date) && date.getFullYear() >= 1000) return date
  }
  return null
}

/** Shows a date as "Oct 10, 2026"; a typed date takes effect on blur or Enter. */
function DateField({
  label,
  value,
  today,
  onChange,
}: {
  label: string
  value: Date | undefined
  today: string
  onChange: (date: Date) => void
}) {
  const shown = value ? format(value, FIELD_FORMAT) : ''
  const [text, setText] = useState(shown)
  useEffect(() => setText(shown), [shown])

  const commit = () => {
    const date = parseTyped(text)
    const iso = date && toIso(date)
    if (date && iso && iso >= EARLIEST_CUSTOM_DATE && iso <= today) onChange(date)
    else setText(shown)
  }

  return (
    <Input
      type="text"
      inputMode="text"
      aria-label={label}
      placeholder="Oct 1, 2026"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit()
      }}
      className="h-9 w-full sm:w-36"
    />
  )
}

function RangeFields({
  draft,
  today,
  maxLabel,
  onFromChange,
  onToChange,
}: {
  draft: DayPickerRange | undefined
  today: string
  maxLabel: string
  onFromChange: (date: Date) => void
  onToChange: (date: Date) => void
}) {
  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <div className="flex items-center gap-2">
        <DateField label="Start date" value={draft?.from} today={today} onChange={onFromChange} />
        <span aria-hidden="true">–</span>
        <DateField label="End date" value={draft?.to} today={today} onChange={onToChange} />
      </div>
      <span className="text-xs text-muted-foreground">{maxLabel}</span>
    </div>
  )
}

// The draft opens on the range in view and is applied the moment an edit completes it, so an
// untouched preset never turns into the whole days it touches.
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
  const narrow = useIsNarrowViewport()
  const [draft, setDraftState] = useState(() => toDraft(value))
  const [month, setMonth] = useState(today)
  // Shows the draft's start, with the month after it beside it when there is room.
  const showFrom = (from: Date | undefined) =>
    setMonth(from ?? (narrow ? today : subMonths(today, 1)))
  const edit = (next: DayPickerRange) => {
    setDraftState(next)
    const range = next.to ? applicableRange(next, maxDays, toIso(today)) : null
    if (range) onComplete(range)
  }
  const reset = () => {
    const next = toDraft(value)
    setDraftState(next)
    showFrom(next?.from)
  }
  const setFrom = (from: Date) => {
    edit({ from, to: draft?.to && draft.to >= from ? draft.to : undefined })
    showFrom(from)
  }
  const setTo = (to: Date) => {
    edit({ from: draft?.from && draft.from <= to ? draft.from : to, to })
    setMonth(narrow ? to : subMonths(to, 1))
  }
  return { draft, edit, month, setMonth, reset, setFrom, setTo }
}

function RangeButton({ label }: { label: string }) {
  return (
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        size="sm"
        aria-label={`Date range: ${label}`}
        className="gap-1.5 whitespace-nowrap font-normal"
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {label}
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
  )
}

function RangePanel({
  periods,
  activeKey,
  target,
  range,
  maxDays,
  maxLabel,
  todayIso,
  onClose,
}: {
  periods: StationPeriod[]
  activeKey: string | null
  target: PeriodTarget
  range: ReturnType<typeof useRangeDraft>
  maxDays: number
  maxLabel: string
  todayIso: string
  onClose: () => void
}) {
  return (
    <PopoverContent
      // Taller than a phone's room above or below the button, so it scrolls within it.
      className="flex max-h-[--radix-popover-content-available-height] w-auto max-w-[calc(100vw-2rem)] flex-col overflow-y-auto p-0 sm:flex-row"
      align="start"
      collisionPadding={8}
    >
      <PeriodList periods={periods} activeKey={activeKey} target={target} onPicked={onClose} />
      <div className="flex flex-col">
        <RangeCalendar
          draft={range.draft}
          onDraftChange={range.edit}
          month={range.month}
          onMonthChange={range.setMonth}
          maxDays={maxDays}
          today={parseISO(todayIso)}
        />
        <RangeFields
          draft={range.draft}
          today={todayIso}
          maxLabel={maxLabel}
          onFromChange={range.setFrom}
          onToChange={range.setTo}
        />
      </div>
    </PopoverContent>
  )
}

/**
 * A button naming the range in view (a preset's name or custom dates) that opens every preset
 * beside a range calendar. Custom dates are whole days in the center's zone, applied as soon as
 * both ends are picked or typed.
 */
export function StationRangePicker({
  periods,
  activePeriod,
  custom,
  onApplyCustom,
  maxDays,
  maxLabel,
  timeZone,
  className,
  ...target
}: PeriodTarget & {
  /** Every preset, listed in the popover. */
  periods: StationPeriod[]
  activePeriod: StationPeriod
  custom: DateRange | null
  onApplyCustom: (range: DateRange) => void
  maxDays: number
  maxLabel: string
  timeZone: string
  className?: string
}) {
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

  return (
    <div className={className}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) range.reset()
          setOpen(next)
        }}
      >
        <RangeButton
          label={custom ? formatRangeLabel(custom, now, timeZone) : activePeriod.label}
        />
        <RangePanel
          periods={periods}
          activeKey={custom ? null : activePeriod.key}
          target={target}
          range={range}
          maxDays={maxDays}
          maxLabel={maxLabel}
          todayIso={todayIso}
          onClose={() => setOpen(false)}
        />
      </Popover>
    </div>
  )
}
