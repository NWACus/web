'use client'

import { DatePickerField } from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import { QuickDateFilter } from '@/utilities/createQuickDateFilters'
import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useState } from 'react'

type DateRangeFilterProps = {
  startDate: string
  endDate: string
  quickFilters: QuickDateFilter[]
  title?: string
  titleClassName?: string
  defaultOpen?: boolean
  showBottomBorder?: boolean
}

// Match a (start, end) pair against the supplied quick filters.
// Returns the matching filter id, or 'custom' for non-matching dates,
// or '' when both dates are empty.
function matchQuickFilter(start: string, end: string, quickFilters: QuickDateFilter[]): string {
  if (!start && !end) return ''
  const matching = quickFilters.find((filter) => {
    const filterStart = filter.startDate()
    const filterEnd = filter.endDate() || ''
    return filterStart === start && filterEnd === end
  })
  return matching ? matching.id : 'custom'
}

export const DateRangeFilter = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  quickFilters,
  title = 'Date Range',
  titleClassName,
  defaultOpen = true,
  showBottomBorder = true,
}: DateRangeFilterProps) => {
  const [{ startDate, endDate }, setDateParams] = useQueryStates(
    {
      startDate: parseAsString.withDefault(''),
      endDate: parseAsString.withDefault(''),
    },
    {
      history: 'push',
      shallow: false,
    },
  )

  const [isOpen, setIsOpen] = useState(defaultOpen)
  // Tracks whether the user explicitly clicked Custom while their dates still
  // matched a quick filter. Distinct from the URL-derived match so the user can
  // see "Custom" highlighted without changing dates.
  const [customMode, setCustomMode] = useState(false)

  const currentStart = startDate || initialStartDate
  const currentEnd = endDate || initialEndDate
  const matchedFilter = matchQuickFilter(currentStart, currentEnd, quickFilters)
  const quickFilter = customMode ? 'custom' : matchedFilter

  const updateDateSelection = useCallback(
    (filter: string, start: string, end: string) => {
      setCustomMode(filter === 'custom')
      setDateParams({
        startDate: start || null,
        endDate: end || null,
      })
    },
    [setDateParams],
  )

  const handleQuickFilter = useCallback(
    (filterKey: string) => {
      const filter = quickFilters.find((f) => f.id === filterKey)
      if (filter) {
        const start = filter.startDate()
        const end = filter.endDate() || ''
        updateDateSelection(filterKey, start, end)
      } else {
        updateDateSelection(filterKey, startDate, endDate)
      }
    },
    [endDate, startDate, quickFilters, updateDateSelection],
  )

  // If neither URL nor server-rendered initial dates are set, default to
  // 'upcoming'. setTimeout avoids a hydration race with nuqs reading the URL.
  // This is a one-shot bootstrap, not a state sync.
  useEffect(() => {
    if (!currentStart && !currentEnd) {
      const timer = setTimeout(() => handleQuickFilter('upcoming'), 0)
      return () => clearTimeout(timer)
    }
  }, [currentStart, currentEnd, handleQuickFilter])

  const renderQuickFilterButton = (id: string) => {
    const filter = quickFilters.find((f) => f.id === id)
    if (!filter) return null
    return (
      <Button
        onClick={() => handleQuickFilter(filter.id)}
        variant={quickFilter === filter.id ? 'default' : 'outline'}
        className="flex-1"
      >
        {filter.label}
      </Button>
    )
  }

  return (
    <div className={showBottomBorder ? 'border-b' : ''}>
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
        >
          <h3 className={cn('font-semibold', titleClassName)}>{title}</h3>
          <div className="flex items-center gap-2">
            {quickFilter && quickFilter !== 'upcoming' && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  handleQuickFilter('upcoming')
                }}
                variant="ghost"
                className="underline text-sm h-auto p-0"
              >
                Clear
              </Button>
            )}
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {isOpen && (
          <div className="pb-4">
            <div className="mb-4 grid grid-cols-2 gap-2">
              {renderQuickFilterButton('upcoming')}
              {renderQuickFilterButton('this-week')}
              {renderQuickFilterButton('next-week')}
              {renderQuickFilterButton('this-month')}
              {renderQuickFilterButton('next-month')}
              {renderQuickFilterButton('past')}
            </div>

            <Button
              onClick={() => handleQuickFilter('custom')}
              variant={quickFilter === 'custom' ? 'default' : 'outline'}
              className="w-full"
            >
              Custom date range
            </Button>

            {/* Custom Date Range */}
            {quickFilter === 'custom' && (
              <div className="flex gap-4 mt-4">
                <DatePickerField
                  label="Start Date"
                  value={startDate}
                  id="customStart"
                  onChange={(date) => updateDateSelection('custom', date, endDate)}
                />
                <DatePickerField
                  label="End Date"
                  value={endDate}
                  id="customEnd"
                  onChange={(date) => updateDateSelection('custom', startDate, date)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
