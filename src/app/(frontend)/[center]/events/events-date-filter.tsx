'use client'
import { QUICK_DATE_FILTERS } from '@/collections/Events/constants'
import { DatePickerField } from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  startDate: string
  endDate: string
}

export const EventsDatePicker = ({ startDate, endDate }: Props) => {
  const [filterType, setFilterType] = useState('')
  const [customStart, setCustomStart] = useState(startDate)
  const [customEnd, setCustomEnd] = useState(endDate || '')
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
      const filter = QUICK_DATE_FILTERS.find((f) => f.id === filterKey)
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
    const filter = QUICK_DATE_FILTERS.find((f) => f.id === id)
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
    if (isInitialMount.current && ((!startDate && !endDate) || (startDate && !endDate))) {
      handleQuickFilter('upcoming')
    }
    if (isInitialMount.current && startDate && endDate) {
      updateDateSelection('custom', startDate, endDate)
    }
    isInitialMount.current = false
  }, [endDate, startDate, handleQuickFilter, updateDateSelection])

  return (
    <div className="w-full">
      <div className="hidden md:flex justify-between items-center">
        <h3 className="font-semibold my-2">Filter by date</h3>
        {filterType && filterType !== 'upcoming' && (
          <Button onClick={() => handleQuickFilter('upcoming')} variant="ghost">
            <X width={16} />
          </Button>
        )}
      </div>
      <hr className="hidden md:block p-2" />

      <div className="mb-4 flex flex-wrap gap-2">
        {renderQuickFilterButton('upcoming')}
        {renderQuickFilterButton('next-week')}
        {renderQuickFilterButton('this-week')}
        {renderQuickFilterButton('next-month')}
        {renderQuickFilterButton('this-month')}
        {renderQuickFilterButton('past-events')}

        <Button
          onClick={() => handleQuickFilter('custom')}
          variant={filterType === 'custom' ? 'callout' : 'outline'}
          className="w-full"
        >
          Custom date range
        </Button>
      </div>

      {/* Custom Date Range */}
      {filterType === 'custom' && (
        <div className="flex gap-4">
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
  )
}
