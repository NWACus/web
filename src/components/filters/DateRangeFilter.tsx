'use client'

import { DatePickerField } from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import { QuickDateFilter } from '@/utilities/createQuickDateFilters'
import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useRef, useState } from 'react'

type DateRangeFilterProps = {
  startDate: string
  endDate: string
  quickFilters: QuickDateFilter[]
  title?: string
  titleClassName?: string
  defaultOpen?: boolean
  showBottomBorder?: boolean
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

  const [quickFilter, setQuickFilter] = useState('')
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const isInitialMount = useRef(true)

  const updateDateSelection = useCallback(
    (filter: string, start: string, end: string) => {
      console.log(`Setting filter to ${filter} and startDate: ${start} and endDate: ${end}.`)
      setQuickFilter(filter)
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

  useEffect(
    function determineMatchingQuickFilter() {
      const currentStart = startDate || initialStartDate
      const currentEnd = endDate || initialEndDate

      if (!currentStart && !currentEnd) {
        // No dates set, set start date and set quick filter to upcoming
        // setTimeout needed to avoid hydration race condition with nuqs
        setTimeout(() => {
          handleQuickFilter('upcoming')
        }, 0)
        return
      }

      if (isInitialMount.current) {
        if (currentStart) {
          // Try to match against quick filters
          const matchingFilter = quickFilters.find((filter) => {
            const filterStart = filter.startDate()
            const filterEnd = filter.endDate() || ''
            return filterStart === currentStart && filterEnd === currentEnd
          })

          if (matchingFilter) {
            setQuickFilter(matchingFilter.id)
          } else {
            // No match found, must be custom
            setQuickFilter('custom')
          }
        }
        isInitialMount.current = false
      }
    },
    [endDate, handleQuickFilter, initialEndDate, initialStartDate, quickFilters, startDate],
  )

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
