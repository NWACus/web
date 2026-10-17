'use client'

import { useIsNarrowViewport } from '@/components/charts/useIsNarrowViewport'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { addDays, format, max, min, parseISO, subDays, subMonths } from 'date-fns'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { DateRange as DayPickerRange } from 'react-day-picker'
import type { DateRange } from './stationPeriods'
import { EARLIEST_CUSTOM_DATE, todayInZone } from './stationPeriods'

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

function RangeCalendar({
  draft,
  onDraftChange,
  maxDays,
  timeZone,
}: {
  draft: DayPickerRange | undefined
  onDraftChange: (draft: DayPickerRange | undefined) => void
  maxDays: number
  timeZone: string
}) {
  const narrow = useIsNarrowViewport()
  const today = parseISO(todayInZone(new Date(), timeZone))
  const { earliest, latest } = selectableBounds(draft, today, maxDays)
  return (
    <Calendar
      mode="range"
      selected={draft}
      onSelect={(_range, day) => onDraftChange(nextDraft(draft, day))}
      numberOfMonths={narrow ? 1 : 2}
      defaultMonth={draft?.from ?? (narrow ? today : subMonths(today, 1))}
      startMonth={parseISO(EARLIEST_CUSTOM_DATE)}
      endMonth={today}
      disabled={{ before: earliest, after: latest }}
      captionLayout="dropdown"
      // Two months side by side would otherwise highlight the same days twice.
      showOutsideDays={false}
    />
  )
}

function RangeFooter({
  maxLabel,
  canApply,
  onCancel,
  onApply,
}: {
  maxLabel: string
  canApply: boolean
  onCancel: () => void
  onApply: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
      <span className="text-xs text-muted-foreground">{maxLabel}</span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!canApply} onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  )
}

/**
 * A range calendar anchored to `children`, opened and closed by the caller. Dates are whole days
 * in the center's zone; nothing changes until Apply.
 */
export function DateRangePopover({
  open,
  onOpenChange,
  value,
  maxDays,
  maxLabel,
  timeZone,
  onApply,
  align = 'start',
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: DateRange | null
  maxDays: number
  /** Shown under the calendar, e.g. "Up to 92 days". */
  maxLabel: string
  timeZone: string
  onApply: (range: DateRange) => void
  align?: 'start' | 'end'
  children: ReactNode
}) {
  const [draft, setDraft] = useState(() => toDraft(value))

  const changeOpen = (next: boolean) => {
    if (next) setDraft(toDraft(value))
    onOpenChange(next)
  }

  const apply = () => {
    if (!draft?.from) return
    onApply({ from: toIso(draft.from), to: toIso(draft.to ?? draft.from) })
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        className="w-auto p-0"
        align={align}
        // The graphs' Select hands focus back to its trigger after opening this; outside
        // clicks and Escape still close it.
        onFocusOutside={(event) => event.preventDefault()}
      >
        <RangeCalendar
          draft={draft}
          onDraftChange={setDraft}
          maxDays={maxDays}
          timeZone={timeZone}
        />
        <RangeFooter
          maxLabel={maxLabel}
          canApply={Boolean(draft?.from)}
          onCancel={() => onOpenChange(false)}
          onApply={apply}
        />
      </PopoverContent>
    </Popover>
  )
}
