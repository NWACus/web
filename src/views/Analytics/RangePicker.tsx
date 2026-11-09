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
const DATE_FIELD = cn(
  'flex w-40 flex-col gap-1 text-xs',
  '[&_input]:h-[32px] [&_input]:min-h-0 [&_input]:py-0 [&_input]:text-[1rem]',
  // The clear control is the only button inside the field, so target it by tag: Tailwind reads the
  // `_` in its BEM class name as a space and cannot match it directly
  '[&_.icon--calendar]:top-[7px] [&_button]:top-[6px]',
)

export type RangeSelection = { preset: RangePreset } | { preset: 'custom'; range: DateRange }

const pad = (n: number) => String(n).padStart(2, '0')
// The picker returns local midnight; read the calendar fields rather than shifting through UTC
const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

function CustomRange({
  range,
  onApply,
}: {
  range: DateRange
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
      <label className={DATE_FIELD}>
        <span className={MUTED}>From</span>
        <DatePicker
          pickerAppearance="dayOnly"
          value={new Date(`${draft.from}T12:00:00`)}
          onChange={(date) => setDraft({ ...draft, from: toIsoDate(date) })}
        />
      </label>
      <label className={DATE_FIELD}>
        <span className={MUTED}>To</span>
        <DatePicker
          pickerAppearance="dayOnly"
          value={new Date(`${draft.to}T12:00:00`)}
          onChange={(date) => setDraft({ ...draft, to: toIsoDate(date) })}
        />
      </label>
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
  onChange,
}: {
  selection: RangeSelection
  /** The dates the selection currently resolves to, shown under the controls. */
  resolved: DateRange
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
        <CustomRange range={resolved} onApply={(range) => onChange({ preset: 'custom', range })} />
      )}
    </div>
  )
}

export const defaultSelection: RangeSelection = { preset: DEFAULT_PRESET }
