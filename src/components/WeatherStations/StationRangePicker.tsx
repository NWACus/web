'use client'

import { useIsNarrowViewport } from '@/components/charts/useIsNarrowViewport'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utilities/ui'
import { differenceInCalendarDays, format, parseISO, subMonths } from 'date-fns'
import { CalendarDays, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { forwardRef, useEffect, useState } from 'react'
import type { DateRange as DayPickerRange } from 'react-day-picker'
import type { DateRange, StationPeriod } from './stationPeriods'
import {
  EARLIEST_CUSTOM_DATE,
  formatRangeLabel,
  presetRange,
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
} from './stationRangeDraft'

/** How a preset is picked: by navigating to its link, or through a callback. */
type PeriodTarget =
  | { periodHref: (key: string) => string; onSelectPeriod?: never }
  | { onSelectPeriod: (key: string) => void; periodHref?: never }

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
      className="flex flex-wrap gap-1 border-b p-2 sm:flex-col sm:flex-nowrap sm:border-b-0 sm:border-r"
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
              target.onSelectPeriod(period.key)
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
      // Marks today in the center's zone, the last day that can be picked.
      today={today}
      captionLayout="dropdown"
      // Two months side by side would otherwise highlight the same days twice.
      showOutsideDays={false}
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
  today,
  onChange,
}: {
  label: string
  value: Date | undefined
  today: string
  onChange: (date: Date, apply: boolean) => void
}) {
  const shown = value ? format(value, FIELD_FORMAT) : ''
  const [text, setText] = useState(shown)
  useEffect(() => setText(shown), [shown])

  const commit = (apply: boolean) => {
    const date = parseTyped(text)
    const iso = date && toIsoDate(date)
    if (date && iso && iso >= EARLIEST_CUSTOM_DATE && iso <= today) onChange(date, apply)
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
      className="h-9 w-full sm:w-36"
    />
  )
}

function capLabel(maxDays: number): string {
  return maxDays > 366 ? `${Math.round(maxDays / 365)} years` : `${maxDays} days`
}

function RangeFields({
  draft,
  today,
  maxDays,
  onFromChange,
  onToChange,
}: {
  draft: DayPickerRange | undefined
  today: string
  maxDays: number
  onFromChange: (date: Date, apply: boolean) => void
  onToChange: (date: Date, apply: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <div className="flex items-center gap-2">
        <DateField label="Start date" value={draft?.from} today={today} onChange={onFromChange} />
        <span aria-hidden="true">–</span>
        <DateField label="End date" value={draft?.to} today={today} onChange={onToChange} />
      </div>
      {/* Typed dates can overshoot the cap the calendar greys out, so say why nothing applied. */}
      {draft?.from && draft.to && differenceInCalendarDays(draft.to, draft.from) >= maxDays && (
        <p role="alert" className="text-xs text-destructive">
          Pick a range of up to {capLabel(maxDays)}.
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
  const narrow = useIsNarrowViewport()
  const [draft, setDraftState] = useState(() => toDraft(value))
  const [month, setMonth] = useState(today)
  // Shows the draft's start, with the month after it beside it when there is room.
  const showFrom = (from: Date | undefined) =>
    setMonth(from ?? (narrow ? today : subMonths(today, 1)))
  const edit = (next: DayPickerRange, apply = true) => {
    setDraftState(next)
    const range = apply && next.to ? applicableRange(next, maxDays, toIsoDate(today)) : null
    if (range) onComplete(range)
  }
  const reset = () => {
    const next = toDraft(value)
    setDraftState(next)
    showFrom(next?.from)
  }
  const setFrom = (from: Date, apply: boolean) => {
    edit({ from, to: draft?.to && draft.to >= from ? draft.to : undefined }, apply)
    showFrom(from)
  }
  const setTo = (to: Date, apply: boolean) => {
    edit({ from: draft?.from && draft.from <= to ? draft.from : to, to }, apply)
    setMonth(narrow ? to : subMonths(to, 1))
  }
  return { draft, edit, month, setMonth, reset, setFrom, setTo }
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
  periods,
  activeKey,
  target,
  range,
  maxDays,
  todayIso,
  onClose,
}: {
  periods: StationPeriod[]
  activeKey: string | null
  target: PeriodTarget
  range: ReturnType<typeof useRangeDraft>
  maxDays: number
  todayIso: string
  onClose: () => void
}) {
  return (
    <>
      <PeriodList periods={periods} activeKey={activeKey} target={target} onPicked={onClose} />
      <div className="flex flex-col items-center sm:items-stretch">
        <RangeCalendar
          draft={range.draft}
          onDraftChange={(next) => range.edit(next)}
          month={range.month}
          onMonthChange={range.setMonth}
          maxDays={maxDays}
          today={parseISO(todayIso)}
        />
        <RangeFields
          draft={range.draft}
          today={todayIso}
          maxDays={maxDays}
          onFromChange={range.setFrom}
          onToChange={range.setTo}
        />
      </div>
    </>
  )
}

type ShellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  children: ReactNode
}

function RangeDialog({ open, onOpenChange, label, children }: ShellProps) {
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

function RangePopover({ open, onOpenChange, label, children }: ShellProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <RangeButton label={label} />
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-row p-0" align="center" collisionPadding={8}>
        {children}
      </PopoverContent>
    </Popover>
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
  timeZone: string
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
  const label = custom ? formatRangeLabel(custom, now, timeZone) : activePeriod.label
  const body = (
    <RangeBody
      periods={periods}
      activeKey={custom ? null : activePeriod.key}
      target={target}
      range={range}
      maxDays={maxDays}
      todayIso={todayIso}
      onClose={() => setOpen(false)}
    />
  )

  // A phone has no room for a popover beside the button, so the picker opens as a dialog.
  const Shell = narrow ? RangeDialog : RangePopover
  return (
    <div className={className}>
      <Shell open={open} onOpenChange={changeOpen} label={label}>
        {body}
      </Shell>
    </div>
  )
}
