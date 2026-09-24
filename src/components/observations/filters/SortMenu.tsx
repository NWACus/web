'use client'

/**
 * The widget's sort dropdown: by the observation's (or avalanche's) date or by submission date,
 * newest or oldest first. Kept in the URL with the filters — the widget kept it in browser storage,
 * where it overrode whatever a shared link asked for.
 */
import { ArrowDownUp } from 'lucide-react'

import type { ObservationKind } from '@/services/nac/model/observation'
import type { ListState, SortBy, SortOrder } from '@/services/nac/observations/filters'

import { CheckOption, FilterDropdown } from './controls'

interface SortMenuProps {
  kind: ObservationKind
  list: ListState
  onChange: (patch: { sortBy?: SortBy; sortOrder?: SortOrder; page: number }) => void
}

export function SortMenu({ kind, list, onChange }: SortMenuProps) {
  const dateLabel = `${kind === 'observation' ? 'Observation' : 'Avalanche'} Date`
  return (
    <FilterDropdown
      label={
        <>
          <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Sort</span>
        </>
      }
      contentClassName="w-56"
    >
      <fieldset className="mb-3">
        <legend className="mb-1 text-sm font-semibold">Sort By</legend>
        <CheckOption
          type="radio"
          label={dateLabel}
          checked={list.sortBy === 'date'}
          onChange={() => onChange({ sortBy: 'date', page: 1 })}
        />
        <CheckOption
          type="radio"
          label="Submission Date"
          checked={list.sortBy === 'createdAt'}
          onChange={() => onChange({ sortBy: 'createdAt', page: 1 })}
        />
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Sort Order</legend>
        <CheckOption
          type="radio"
          label="Newest First"
          checked={list.sortOrder === 'desc'}
          onChange={() => onChange({ sortOrder: 'desc', page: 1 })}
        />
        <CheckOption
          type="radio"
          label="Oldest First"
          checked={list.sortOrder === 'asc'}
          onChange={() => onChange({ sortOrder: 'asc', page: 1 })}
        />
      </fieldset>
    </FilterDropdown>
  )
}
