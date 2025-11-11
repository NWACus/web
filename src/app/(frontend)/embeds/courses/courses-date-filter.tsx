'use client'

import { DatePickerField } from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import { QUICK_DATE_FILTERS_COURSES } from '@/constants/quickDateFilters'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  startDate: string
  endDate: string
}

export const CoursesDateFilter = ({ startDate, endDate }: Props) => {
  const [filterType, setFilterType] = useState('')
  const [customStart, setCustomStart] = useState(startDate)
  const [customEnd, setCustomEnd] = useState(endDate || '')
  const [isOpen, setIsOpen] = useState(true)
  const isInitialMount = useRef(true)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (start: string, end: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (start) {
        params.set('startDate', start)
      } else {
        params.delete('startDate')
      }
      if (end) {
        params.set('endDate', end)
      } else {
        params.delete('endDate')
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const updateDateSelection = useCallback(
    (filter: string, start: string, end: string) => {
      setFilterType(filter)
      setCustomStart(start)
      setCustomEnd(end)
      updateParams(start, end)
    },
    [updateParams],
  )

  const handleQuickFilter = useCallback(
    (filterKey: string) => {
      const filter = QUICK_DATE_FILTERS_COURSES.find((f) => f.id === filterKey)
      if (filter) {
        const start = filter.startDate()
        const end = filter.endDate() || ''
        updateDateSelection(filterKey, start, end)
      } else {
        updateDateSelection(filterKey, customStart, customEnd)
      }
    },
    [customEnd, customStart, updateDateSelection],
  )

  const renderQuickFilterButton = (id: string) => {
    const filter = QUICK_DATE_FILTERS_COURSES.find((f) => f.id === id)
    if (!filter) return null
    return (
      <Button
        onClick={() => handleQuickFilter(filter.id)}
        variant={filterType === filter.id ? 'callout' : 'outline'}
        className="flex-1"
      >
        {filter.label}
      </Button>
    )
  }

  useEffect(() => {
    if (isInitialMount.current) {
      if ((!startDate && !endDate) || (startDate && !endDate)) {
        // No dates set or only start date, default to upcoming
        setFilterType('upcoming')
      } else if (startDate && endDate) {
        // Try to match against quick filters
        const matchingFilter = QUICK_DATE_FILTERS_COURSES.find((filter) => {
          const filterStart = filter.startDate()
          const filterEnd = filter.endDate() || ''
          return filterStart === startDate && filterEnd === endDate
        })

        if (matchingFilter) {
          setFilterType(matchingFilter.id)
        } else {
          // No match found, must be custom
          setFilterType('custom')
        }
      }
      isInitialMount.current = false
    }
  }, [endDate, startDate])

  return (
    <div className="border-b">
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
        >
          <h3 className="font-semibold">Date Range</h3>
          <div className="flex items-center gap-2">
            {filterType && filterType !== 'upcoming' && (
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
              variant={filterType === 'custom' ? 'callout' : 'outline'}
              className="w-full"
            >
              Custom date range
            </Button>

            {/* Custom Date Range */}
            {filterType === 'custom' && (
              <div className="flex gap-4 mt-4">
                <DatePickerField
                  label="Start Date"
                  value={customStart}
                  id="customStart"
                  onChange={(date) => updateDateSelection('custom', date, customEnd)}
                />
                <DatePickerField
                  label="End Date"
                  value={customEnd}
                  id="customEnd"
                  onChange={(date) => updateDateSelection('custom', customStart, date)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
