import { addDays, isValid, max, min, parse, parseISO, subDays } from 'date-fns'
import type { DateRange as DayPickerRange } from 'react-day-picker'
import type { DateRange } from './stationPeriods'
import { rangeDays, toIsoDate } from './stationPeriods'

// The range picker's draft rules, kept apart from its components so they can be tested.

export function toDraft(range: DateRange | null): DayPickerRange | undefined {
  return range ? { from: parseISO(range.from), to: parseISO(range.to) } : undefined
}

// The first click picks the start, the second the end (either order); a third starts over.
// DayPicker's own rule closes the range on the first click, which reads as a one-day pick.
export function nextDraft(draft: DayPickerRange | undefined, day: Date): DayPickerRange {
  if (!draft?.from || draft.to) return { from: day, to: undefined }
  return day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day }
}

// Once a start is picked, days that would push the range past `maxDays` go grey.
export function selectableBounds(
  draft: DayPickerRange | undefined,
  season: DateRange,
  maxDays: number,
) {
  const earliest = parseISO(season.from)
  const latest = parseISO(season.to)
  if (!draft?.from || draft.to) return { earliest, latest }
  return {
    earliest: max([earliest, subDays(draft.from, maxDays - 1)]),
    latest: min([latest, addDays(draft.from, maxDays - 1)]),
  }
}

/** The draft as a range to apply, or null when it is incomplete or outside the season. */
export function applicableRange(
  draft: DayPickerRange | undefined,
  maxDays: number,
  season: DateRange,
): DateRange | null {
  if (!draft?.from) return null
  const range = { from: toIsoDate(draft.from), to: toIsoDate(draft.to ?? draft.from) }
  const inBounds = range.from >= season.from && range.to <= season.to
  return inBounds && range.from <= range.to && rangeDays(range) <= maxDays ? range : null
}

export const FIELD_FORMAT = 'MMM d, yyyy'
// Typed dates: the field's own format, then numeric US and ISO dates.
const TYPED_FORMATS = [FIELD_FORMAT, 'MMM d yyyy', 'M/d/yyyy', 'yyyy-MM-dd', 'MMM d, yy', 'M/d/yy']

export function parseTyped(text: string): Date | null {
  const trimmed = text.trim()
  for (const pattern of TYPED_FORMATS) {
    const date = parse(trimmed, pattern, new Date())
    // A `yyyy` pattern reads "26" as the year 26, so leave short years to the `yy` patterns.
    if (isValid(date) && date.getFullYear() >= 1000) return date
  }
  return null
}
