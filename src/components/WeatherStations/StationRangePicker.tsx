'use client'

import { useIsNarrowViewport } from '@/components/charts/useIsNarrowViewport'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utilities/ui'
import { addDays, format, isValid, max, min, parseISO, subDays, subMonths } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { DateRange as DayPickerRange } from 'react-day-picker'
import { ChipGroup, chipClass } from './ChipGroup'
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

/** The draft as a range Apply can take, or null when it is incomplete or out of bounds. */
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
  onDraftChange: (draft: DayPickerRange | undefined) => void
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
  return (
    <Input
      type="date"
      aria-label={label}
      value={value ? toIso(value) : ''}
      min={EARLIEST_CUSTOM_DATE}
      max={today}
      onChange={(event) => {
        const date = parseISO(event.target.value)
        if (isValid(date)) onChange(date)
      }}
      className="h-9 w-full sm:w-40"
    />
  )
}

function RangeFooter({
  draft,
  today,
  maxLabel,
  canApply,
  onFromChange,
  onToChange,
  onCancel,
  onApply,
}: {
  draft: DayPickerRange | undefined
  today: string
  maxLabel: string
  canApply: boolean
  onFromChange: (date: Date) => void
  onToChange: (date: Date) => void
  onCancel: () => void
  onApply: () => void
}) {
  return (
    <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <DateField label="Start date" value={draft?.from} today={today} onChange={onFromChange} />
        <span aria-hidden="true">–</span>
        <DateField label="End date" value={draft?.to} today={today} onChange={onToChange} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{maxLabel}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canApply} onClick={onApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}

function useRangeDraft(value: DateRange | null, today: Date) {
  const narrow = useIsNarrowViewport()
  const [draft, setDraft] = useState(() => toDraft(value))
  const [month, setMonth] = useState(today)
  // Shows the draft's start, with the month after it beside it when there is room.
  const showFrom = (from: Date | undefined) =>
    setMonth(from ?? (narrow ? today : subMonths(today, 1)))
  const reset = () => {
    const next = toDraft(value)
    setDraft(next)
    showFrom(next?.from)
  }
  const setFrom = (from: Date) => {
    setDraft((d) => ({ from, to: d?.to && d.to >= from ? d.to : undefined }))
    showFrom(from)
  }
  const setTo = (to: Date) => {
    setDraft((d) => ({ from: d?.from && d.from <= to ? d.from : to, to }))
    setMonth(narrow ? to : subMonths(to, 1))
  }
  return { draft, setDraft, month, setMonth, reset, setFrom, setTo }
}

function RangeButton({ label, active }: { label: string; active: boolean }) {
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        className={cn(chipClass(active), 'inline-flex items-center gap-1.5 whitespace-nowrap')}
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
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
  onApplyCustom,
  onClose,
}: {
  periods: StationPeriod[]
  activeKey: string | null
  target: PeriodTarget
  range: ReturnType<typeof useRangeDraft>
  maxDays: number
  maxLabel: string
  todayIso: string
  onApplyCustom: (range: DateRange) => void
  onClose: () => void
}) {
  const applicable = applicableRange(range.draft, maxDays, todayIso)
  return (
    <PopoverContent
      // Taller than a phone's room above or below the button, so it scrolls within it.
      className="max-h-[--radix-popover-content-available-height] w-auto max-w-[calc(100vw-2rem)] overflow-y-auto p-0"
      align="start"
      collisionPadding={8}
    >
      <div className="flex flex-col sm:flex-row">
        <PeriodList periods={periods} activeKey={activeKey} target={target} onPicked={onClose} />
        <RangeCalendar
          draft={range.draft}
          onDraftChange={range.setDraft}
          month={range.month}
          onMonthChange={range.setMonth}
          maxDays={maxDays}
          today={parseISO(todayIso)}
        />
      </div>
      <RangeFooter
        draft={range.draft}
        today={todayIso}
        maxLabel={maxLabel}
        canApply={applicable !== null}
        onFromChange={range.setFrom}
        onToChange={range.setTo}
        onCancel={onClose}
        onApply={() => {
          if (!applicable) return
          onApplyCustom(applicable)
          onClose()
        }}
      />
    </PopoverContent>
  )
}

/**
 * Quick preset chips plus a button showing the dates in view, which opens every preset beside a
 * range calendar. Custom dates are whole days in the center's zone; nothing changes until Apply.
 */
export function StationRangePicker({
  periods,
  quickKeys,
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
  /** The presets also shown as chips. */
  quickKeys: string[]
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
  const today = parseISO(todayIso)
  const [open, setOpen] = useState(false)
  const range = useRangeDraft(custom, today)
  const activeKey = custom ? null : activePeriod.key

  const chips = periods
    .filter((p) => quickKeys.includes(p.key))
    .map((p) => ({ key: p.key, label: p.label, href: target.periodHref?.(p.key) }))

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <ChipGroup chips={chips} activeKey={activeKey} onSelect={target.onSelectPeriod} />
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) range.reset()
          setOpen(next)
        }}
      >
        <RangeButton
          label={formatRangeLabel(
            custom ?? presetRange(activePeriod, timeZone, now),
            now,
            timeZone,
          )}
          active={custom !== null}
        />
        <RangePanel
          periods={periods}
          activeKey={activeKey}
          target={target}
          range={range}
          maxDays={maxDays}
          maxLabel={maxLabel}
          todayIso={todayIso}
          onApplyCustom={onApplyCustom}
          onClose={() => setOpen(false)}
        />
      </Popover>
    </div>
  )
}
