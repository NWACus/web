'use client'

/**
 * The applied filters as removable tags above the list, in the widget's wording, with a
 * "Clear All" — the one place a filter can be lifted without opening the sheet.
 */
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ObservationKind, ObservationZoneOption } from '@/services/nac/model/observation'
import {
  activeTags,
  type FilterTag,
  type ObservationFilters,
} from '@/services/nac/observations/filters'
import { OBSERVER_TYPES, labelFor } from '@/services/nac/observations/options'

import { formatDay } from '../format'

interface TagContext {
  zones: ObservationZoneOption[]
  centerLabel: string
}

const feet = (value: number) => `${value.toLocaleString('en-US')} ft`

/** "5,000 - 9,000 ft", "> 5,000 ft" or "< 9,000 ft", as the widget words the elevation tag. */
export function elevationLabel({
  elevationMin: min,
  elevationMax: max,
}: ObservationFilters): string {
  if (min === null) return `< ${feet(max ?? 0)}`
  return max === null ? `> ${feet(min)}` : `${min.toLocaleString('en-US')} - ${feet(max)}`
}

type LabelFor = (filters: ObservationFilters, context: TagContext) => string

/** Tags that stand for a whole filter rather than one of its values. */
const WHOLE_FILTER_LABELS: Partial<Record<FilterTag['key'], LabelFor>> = {
  dates: (filters) => `${formatDay(filters.from)} - ${formatDay(filters.to)}`,
  onlyCenter: (_filters, context) => `Only ${context.centerLabel}`,
  instability: () => 'Cracking/Collapsing',
  avalanchesObserved: () => 'Avalanches Observed',
  size: (filters) => `D${filters.size[0]} - D${filters.size[1]}`,
  elevation: elevationLabel,
}

/** One value of a list filter; zones and observer types have names, the rest are their names. */
type ValueTag = Extract<FilterTag, { value: string }>

const VALUE_LABELS: Partial<
  Record<ValueTag['key'], (value: string, context: TagContext) => string | null>
> = {
  zones: (value, context) => context.zones.find((zone) => zone.id === value)?.name ?? null,
  observers: (value) => labelFor(value, OBSERVER_TYPES),
}

function valueLabel(tag: ValueTag, context: TagContext): string {
  return VALUE_LABELS[tag.key]?.(tag.value, context) ?? tag.value
}

export function tagLabel(tag: FilterTag, filters: ObservationFilters, context: TagContext): string {
  if ('value' in tag) return valueLabel(tag, context)
  return WHOLE_FILTER_LABELS[tag.key]?.(filters, context) ?? tag.key
}

interface FilterTagsProps extends TagContext {
  kind: ObservationKind
  filters: ObservationFilters
  today: string
  onRemove: (tag: FilterTag) => void
  onClearAll?: () => void
}

function ClearAll({ onClearAll }: { onClearAll?: () => void }) {
  if (!onClearAll) return null
  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-6 px-1 text-xs"
      onClick={onClearAll}
    >
      Clear All
    </Button>
  )
}

export function FilterTags({
  kind,
  filters,
  today,
  onRemove,
  onClearAll,
  ...context
}: FilterTagsProps) {
  const tags = activeTags(filters, kind, today)
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
      {tags.map((tag) => {
        const label = tagLabel(tag, filters, context)
        return (
          <button
            key={`${tag.key}-${label}`}
            type="button"
            onClick={() => onRemove(tag)}
            aria-label={`Remove filter: ${label}`}
            className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs hover:border-primary"
          >
            {label}
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )
      })}
      <ClearAll onClearAll={onClearAll} />
    </div>
  )
}
