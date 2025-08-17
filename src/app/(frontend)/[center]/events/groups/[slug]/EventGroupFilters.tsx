'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface EventGroupFiltersProps {
  showPastEvents: boolean
  sort: string
}

export function EventGroupFilters({ showPastEvents, sort }: EventGroupFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateSearchParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex items-center gap-4">
      {/* Show Past Events Toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showPastEvents}
          onChange={(e) => {
            updateSearchParams('showPast', e.target.checked ? 'true' : null)
          }}
          className="rounded"
        />
        Show past events
      </label>

      {/* Sort Dropdown */}
      <select
        value={sort}
        onChange={(e) => {
          updateSearchParams('sort', e.target.value !== 'startDate' ? e.target.value : null)
        }}
        className="text-sm border rounded px-3 py-1"
      >
        <option value="startDate">Date (Earliest First)</option>
        <option value="-startDate">Date (Latest First)</option>
        <option value="title">Title (A-Z)</option>
        <option value="-title">Title (Z-A)</option>
      </select>
    </div>
  )
}
