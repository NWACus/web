'use client'

import {
  DEFAULT_PRESET,
  MAX_RANGE_DAYS,
  RANGE_PRESETS,
  rangeDays,
  type DateRange,
  type RangePreset,
} from '@/services/posthog/analyticsRange'
import { cn } from '@/utilities/ui'
import { Button, DatePicker } from '@payloadcms/ui'
import { useState } from 'react'
import { formatDateRange } from './format'
import { MUTED } from './panels/Panel'
import { TabPills } from './TabPills'

const PRESET_LABELS: Record<RangePreset, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
}

// Payload's date input is 40px tall; trim it to the 32px Apply button beside it and re-centre the
// icons. Pixel values on purpose: the admin's root font size makes rem units drift from the button.
// The right padding keeps the date clear of the clear and calendar icons.
const DATE_FIELD = cn(
  'flex w-[176px] flex-col gap-1 text-xs',
  '[&_input]:h-[32px] [&_input]:min-h-0 [&_input]:py-0 [&_input]:pr-[64px] [&_input]:text-[1rem]',
  // The clear control is the only button inside the field, so target it by tag: Tailwind reads the
  // `_` in its BEM class name as a space and cannot match it directly
  '[&_.icon--calendar]:top-[7px] [&_button]:top-[6px]',
)

export type RangeSelection = { preset: RangePreset } | { preset: 'custom'; range: DateRange }

const pad = (n: number) => String(n).padStart(2, '0')
// The picker returns a local time on the chosen day; read the calendar fields rather than UTC's
const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

// Noon keeps the calendar day the same in every browser timezone
const toPickerDate = (isoDate: string) => new Date(`${isoDate}T12:00:00`)

function DateField({
  label,
  value,
  max,
  onChange,
}: {
  label: string
  value: string
  max: string
  onChange: (isoDate: string) => void
}) {
  // A div, not a label: a label forwards clicks on the calendar to its first control, which is
  // Payload's clear button, and that empties the field
  return (
    <div className={DATE_FIELD}>
      <span className={MUTED}>{label}</span>
      <DatePicker
        pickerAppearance="dayOnly"
        displayFormat="MMM d, yyyy"
        maxDate={toPickerDate(max)}
        value={toPickerDate(value)}
        // Clearing the field or typing an unparseable date reports null; keep the last valid day
        onChange={(date: Date | null) => {
          if (date) onChange(toIsoDate(date))
        }}
      />
    </div>
  )
}

function CustomRange({
  range,
  today,
  onApply,
}: {
  range: DateRange
  today: string
  onApply: (range: DateRange) => void
}) {
  const [draft, setDraft] = useState(range)
  const days = rangeDays(draft)
  const problem =
    draft.from > draft.to
      ? 'The start date must not be after the end date.'
      : days > MAX_RANGE_DAYS
        ? `Ranges are limited to ${MAX_RANGE_DAYS} days.`
        : null
  return (
    <div className="flex flex-wrap items-end gap-3">
      <DateField
        label="From"
        value={draft.from}
        max={today}
        onChange={(from) => setDraft({ ...draft, from })}
      />
      <DateField
        label="To"
        value={draft.to}
        max={today}
        onChange={(to) => setDraft({ ...draft, to })}
      />
      <Button
        buttonStyle="primary"
        size="medium"
        className="m-0"
        disabled={problem !== null}
        onClick={() => onApply(draft)}
      >
        Apply
      </Button>
      {problem && <span className={cn('pb-2 text-xs', MUTED)}>{problem}</span>}
    </div>
  )
}

export function RangePicker({
  selection,
  resolved,
  today,
  onChange,
}: {
  selection: RangeSelection
  /** The dates the selection currently resolves to, shown under the controls. */
  resolved: DateRange
  /** Today in the center's timezone, the latest day the custom range can pick. */
  today: string
  onChange: (selection: RangeSelection) => void
}) {
  const [customOpen, setCustomOpen] = useState(selection.preset === 'custom')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TabPills
          options={[
            ...RANGE_PRESETS.map((preset) => ({ key: preset, label: PRESET_LABELS[preset] })),
            { key: 'custom', label: 'Custom' },
          ]}
          active={customOpen ? 'custom' : selection.preset}
          onChange={(key) => {
            if (key === 'custom') {
              setCustomOpen((open) => !open)
              return
            }
            setCustomOpen(false)
            onChange({ preset: key })
          }}
        />
        <span className={cn('ml-1 text-sm', MUTED)}>
          {formatDateRange(resolved.from, resolved.to)}
        </span>
      </div>
      {customOpen && (
        <CustomRange
          range={resolved}
          today={today}
          onApply={(range) => onChange({ preset: 'custom', range })}
        />
      )}
    </div>
  )
}

export const defaultSelection: RangeSelection = { preset: DEFAULT_PRESET }
