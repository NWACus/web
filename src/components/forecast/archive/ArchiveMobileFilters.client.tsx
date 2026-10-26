'use client'

import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'

import { ArchiveFilters, type ArchiveFiltersProps } from './ArchiveFilters'

interface ArchiveMobileFiltersProps extends ArchiveFiltersProps {
  /** The filtered row count, for the drawer's "Show N products" button. */
  total: number
  hasActiveFilters: boolean
}

/**
 * The filters behind a "Filters" button on narrow screens, as the legacy widget collapses its
 * filter bar behind one. The count is the server's — the list re-renders with every change, so
 * there is no client-side total to track.
 */
export function ArchiveMobileFilters({
  total,
  hasActiveFilters,
  ...filters
}: ArchiveMobileFiltersProps) {
  return (
    <MobileFiltersDrawer docLabel="products" docCount={total} hasActiveFilters={hasActiveFilters}>
      <ArchiveFilters {...filters} />
    </MobileFiltersDrawer>
  )
}
