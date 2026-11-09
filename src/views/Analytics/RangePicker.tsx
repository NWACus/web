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

const PRESET_LABELS: Record<RangePreset, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
}

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
      <label className="flex flex-col gap-1 text-xs">
        <span className={MUTED}>From</span>
        <DatePicker
          pickerAppearance="dayOnly"
          value={new Date(`${draft.from}T12:00:00`)}
          onChange={(date) => setDraft({ ...draft, from: toIsoDate(date) })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className={MUTED}>To</span>
        <DatePicker
          pickerAppearance="dayOnly"
          value={new Date(`${draft.to}T12:00:00`)}
          onChange={(date) => setDraft({ ...draft, to: toIsoDate(date) })}
        />
      </label>
      <Button
        buttonStyle="primary"
        size="small"
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
        {RANGE_PRESETS.map((preset) => (
          <Button
            key={preset}
            buttonStyle={selection.preset === preset && !customOpen ? 'primary' : 'secondary'}
            size="small"
            className="m-0"
            onClick={() => {
              setCustomOpen(false)
              onChange({ preset })
            }}
          >
            {PRESET_LABELS[preset]}
          </Button>
        ))}
        <Button
          buttonStyle={customOpen ? 'primary' : 'secondary'}
          size="small"
          className="m-0"
          onClick={() => setCustomOpen((open) => !open)}
        >
          Custom
        </Button>
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
