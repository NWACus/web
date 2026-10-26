'use client'

/**
 * The strip of active filters above the list — the date range, then a removable chip per selected
 * zone, danger level and product type, and a "Clear filters" control — mirroring the legacy
 * widget's filter tags. The chips are the one place a filter can be undone without opening the
 * sidebar or, on a phone, the drawer.
 */
import { X } from 'lucide-react'
import { useQueryStates } from 'nuqs'

import { Button } from '@/components/ui/button'
import { dangerLevelFromRating, dangerName } from '@/services/nac/dangerScale'
import {
  archiveProductTypeLabel,
  formatArchiveDate,
  type ArchiveProductType,
} from '@/services/nac/forecastArchive'

import { archiveSearchParams } from './archiveSearchParams'

interface ArchiveActiveFiltersProps {
  from: string
  to: string
  /** Whether the range differs from the season's default, and so can be reset. */
  isDateFiltered: boolean
  zones: { slug: string; name: string }[]
  dangers: number[]
  types: ArchiveProductType[]
  isFiltered: boolean
}

export function ArchiveActiveFilters({
  from,
  to,
  isDateFiltered,
  zones,
  dangers,
  types,
  isFiltered,
}: ArchiveActiveFiltersProps) {
  const [, setParams] = useQueryStates(archiveSearchParams, { shallow: false, history: 'push' })

  const without = <T,>(values: T[], value: T) => {
    const rest = values.filter((v) => v !== value)
    return rest.length > 0 ? rest : null
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      <FilterChip
        label={`${formatArchiveDate(from)} – ${formatArchiveDate(to)}`}
        onRemove={
          isDateFiltered ? () => setParams({ from: null, to: null, page: null }) : undefined
        }
      />
      {zones.map((zone) => (
        <FilterChip
          key={zone.slug}
          label={zone.name}
          onRemove={() =>
            setParams({
              zone: without(
                zones.map((z) => z.slug),
                zone.slug,
              ),
              page: null,
            })
          }
        />
      ))}
      {dangers.map((level) => (
        <FilterChip
          key={level}
          label={dangerName(dangerLevelFromRating(level))}
          onRemove={() => setParams({ danger: without(dangers, level), page: null })}
        />
      ))}
      {types.map((type) => (
        <FilterChip
          key={type}
          label={archiveProductTypeLabel(type)}
          onRemove={() => setParams({ type: without(types, type), page: null })}
        />
      ))}
      {isFiltered && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={() =>
            setParams({
              season: null,
              from: null,
              to: null,
              zone: null,
              danger: null,
              type: null,
              page: null,
            })
          }
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}

/** A filter as a small pill; with `onRemove`, a button that lifts it. */
function FilterChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  const className =
    'inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm capitalize'

  if (!onRemove) {
    return <span className={className}>{label}</span>
  }

  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className={`${className} transition-colors hover:border-primary`}
    >
      {label}
      <X className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}
