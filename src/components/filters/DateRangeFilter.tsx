'use client'

import { DatePickerField } from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import { QuickDateFilter } from '@/utilities/createQuickDateFilters'
import { cn } from '@/utilities/ui'
import { format } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
  const [quickFilter, setQuickFilter] = useState('upcoming')
  const [customStart, setCustomStart] = useState(initialStartDate)
  const [customEnd, setCustomEnd] = useState(initialEndDate || '')
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const isUserAction = useRef(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (start: string, end: string) => {
      isUserAction.current = true
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
      setQuickFilter(filter)
      setCustomStart(start)
      setCustomEnd(end)
      updateParams(start, end)
    },
    [updateParams],
  )

  const handleQuickFilter = useCallback(
    (filterKey: string) => {
      const filter = quickFilters.find((f) => f.id === filterKey)
      if (filter) {
        const start = filter.startDate()
        const end = filter.endDate() || ''
        updateDateSelection(filterKey, start, end)
      } else {
        updateDateSelection(filterKey, customStart, customEnd)
      }
    },
    [customEnd, customStart, quickFilters, updateDateSelection],
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

  // Sync state with URL params when they change externally (not from user action)
  useEffect(() => {
    if (isUserAction.current) {
      isUserAction.current = false
      return
    }

    const urlStart = searchParams.get('startDate') || ''
    const urlEnd = searchParams.get('endDate') || ''

    if (!urlStart && !urlEnd) {
      // No URL params, set to today and upcoming
      const today = format(new Date(), 'MM-dd-yyyy')
      setCustomStart(today)
      setCustomEnd('')
      setQuickFilter('upcoming')
      updateParams(today, '')
      return
    }

    // Check if dates match a quick filter
    const matchedFilter = quickFilters.find(
      (f) => f.startDate() === urlStart && (f.endDate() || '') === urlEnd,
    )

    if (matchedFilter) {
      setQuickFilter(matchedFilter.id)
    } else {
      setQuickFilter('custom')
    }

    setCustomStart(urlStart)
    setCustomEnd(urlEnd)
  }, [searchParams, quickFilters, updateParams])

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
