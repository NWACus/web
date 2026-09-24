'use client'

/**
 * The widget's date dropdown: presets ending today, a season select, and a slider over the
 * season's days for any other range. The dropdown's own label names the preset in force, or the
 * range when none is.
 */
import { useState } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  DATE_PRESETS,
  daysBetween,
  daysSinceSeasonStart,
  presetRange,
  seasonEnd,
  seasonOf,
  seasonOptions,
  seasonRange,
  seasonStart,
  selectedPreset,
  shiftDate,
  type ObservationFilters,
} from '@/services/nac/observations/filters'

import { formatDay } from '../format'
import { CheckOption, FilterDropdown } from './controls'

interface DateFilterProps {
  filters: ObservationFilters
  today: string
  startSeason: number
  onChange: (range: { from: string; to: string }) => void
}

export function dateLabel(filters: ObservationFilters, today: string): string {
  return selectedPreset(filters, today) ?? `${formatDay(filters.from)} - ${formatDay(filters.to)}`
}

function Presets({ filters, today, onChange }: Omit<DateFilterProps, 'startSeason'>) {
  const selected = selectedPreset(filters, today)
  const presets = [...DATE_PRESETS, { label: 'This Season', days: daysSinceSeasonStart(today) }]
  return (
    <fieldset className="grid grid-cols-2 gap-x-3">
      <legend className="sr-only">Date range</legend>
      {presets.map((preset) => (
        <CheckOption
          key={preset.label}
          type="radio"
          label={preset.label}
          checked={selected === preset.label}
          onChange={() => onChange(presetRange(today, preset.days))}
        />
      ))}
    </fieldset>
  )
}

/**
 * The season's days as a slider, the widget's day-range control. The label follows the thumbs;
 * the range applies on release, so dragging doesn't refetch on every step.
 */
function DaySlider({ filters, today, onChange }: Omit<DateFilterProps, 'startSeason'>) {
  const season = seasonOf(filters.to)
  const first = seasonStart(season)
  const last = season === seasonOf(today) ? today : seasonEnd(season)
  // Keyed on the range by its parent, so a range set elsewhere starts it afresh.
  const [days, setDays] = useState<[number, number]>(() => [
    daysBetween(first, filters.from),
    daysBetween(first, filters.to),
  ])

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm" aria-live="polite">
        {formatDay(shiftDate(first, days[0]))} to {formatDay(shiftDate(first, days[1]))}
      </div>
      <Slider
        min={0}
        max={daysBetween(first, last)}
        step={1}
        minStepsBetweenThumbs={0}
        value={days}
        thumbLabels={['Start date', 'End date']}
        onValueChange={([from, to]) => setDays([from, to])}
        onValueCommit={([from, to]) =>
          onChange({ from: shiftDate(first, from), to: shiftDate(first, to) })
        }
      />
    </div>
  )
}

export function DateFilterOptions(props: DateFilterProps) {
  const { filters, today, startSeason, onChange } = props
  return (
    <div className="flex flex-col gap-3">
      <Presets filters={filters} today={today} onChange={onChange} />
      <div className="flex flex-col gap-1">
        <Label className="text-sm text-muted-foreground">Season</Label>
        <Select
          value={String(seasonOf(filters.to))}
          onValueChange={(value) => onChange(seasonRange(Number(value), today))}
        >
          <SelectTrigger aria-label="Season">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {seasonOptions(today, startSeason).map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DaySlider
        key={`${filters.from}|${filters.to}`}
        filters={filters}
        today={today}
        onChange={onChange}
      />
    </div>
  )
}

export function DateFilter(props: DateFilterProps) {
  return (
    <FilterDropdown label={dateLabel(props.filters, props.today)} contentClassName="w-80">
      <DateFilterOptions {...props} />
    </FilterDropdown>
  )
}
