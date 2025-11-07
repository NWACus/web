'use client'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  startDate: string
  endDate: string
}

export const EventsDatePicker = ({ startDate, endDate }: Props) => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [filterType, setFilterType] = useState('')
  const [customStart, setCustomStart] = useState(startDate)
  const [customEnd, setCustomEnd] = useState(endDate || '')
  const [hidePastEvents, setHidePastEvents] = useState(true)
  const isInitialMount = useRef(true)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getDateRange = useCallback(
    (type: string) => {
      let start, end
      const today = new Date()

      switch (type) {
        case 'upcoming': {
          start = today
          end = null
          setHidePastEvents(true)
          break
        }
        case 'thisWeek': {
          const dayOfWeek = hidePastEvents ? 0 : today.getDay()
          start = new Date(today)
          start.setDate(today.getDate() - dayOfWeek)
          end = new Date(start)
          end.setDate(start.getDate() + 6)
          break
        }
        case 'nextWeek': {
          const dayOfWeek = today.getDay()
          start = new Date(today)
          start.setDate(today.getDate() + (7 - dayOfWeek))
          end = new Date(start)
          end.setDate(start.getDate() + 6)
          setHidePastEvents(true)
          break
        }
        case 'thisMonth':
        case 'custom': {
          const dayOfWeek = hidePastEvents ? today.getDate() : 1
          start = new Date(today.getFullYear(), today.getMonth(), dayOfWeek)
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          break
        }
        case 'nextMonth': {
          start = new Date(today.getFullYear(), today.getMonth() + 1, 1)
          end = new Date(today.getFullYear(), today.getMonth() + 2, 0)
          setHidePastEvents(true)
          break
        }
        default:
          return null
      }

      return {
        start: start.toISOString().split('T')[0],
        end: end ? end.toISOString().split('T')[0] : null,
      }
    },
    [hidePastEvents],
  )

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
    (type: string) => {
      const range = getDateRange(type)
      if (range) {
        updateDateSelection(type, range.start, range.end || '')
      }
    },
    [getDateRange, updateDateSelection],
  )

  const clearFilter = () => {
    setFilterType('')
    setCustomStart('')
    setCustomEnd('')
    setHidePastEvents(false)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('startDate')
    params.delete('endDate')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleHidePastEventsChange = (checked: boolean) => {
    setHidePastEvents(checked)
  }

  useEffect(() => {
    if (filterType && ['thisWeek', 'thisMonth'].includes(filterType)) {
      handleQuickFilter(filterType)
    } else if (filterType === 'custom' && hidePastEvents) {
      setCustomStart(todayStr)
      updateParams(todayStr, customEnd)
    }
  }, [hidePastEvents, filterType, handleQuickFilter, updateParams, customEnd, todayStr])

  useEffect(() => {
    // On initial load with no params, set filter to 'Upcoming'
    if (isInitialMount.current && !startDate && !endDate) {
      updateDateSelection('upcoming', todayStr, '')
    }
    // On initial load with params, set filter to 'Custom'
    if (isInitialMount.current && startDate && endDate) {
      updateDateSelection('custom', startDate, endDate)
      setHidePastEvents(false)
    }
    isInitialMount.current = false
  }, [endDate, startDate, todayStr, updateDateSelection])

  return (
    <div className="w-full">
      <div className="hidden md:flex justify-between items-center">
        <h3 className="font-semibold">Filter by date</h3>
        {filterType && (
          <Button onClick={clearFilter} variant="ghost">
            <X width={16} />
          </Button>
        )}
      </div>
      <hr className="hidden md:block p-2" />

      <div className="mb-4">
        <ButtonGroup className="w-full">
          <Button
            onClick={() => handleQuickFilter('upcoming')}
            variant={filterType === 'upcoming' ? 'callout' : 'outline'}
            className="w-1/3"
          >
            Upcoming
          </Button>
          <Button
            onClick={() => handleQuickFilter('thisWeek')}
            variant={filterType === 'thisWeek' ? 'callout' : 'outline'}
            className="w-1/3"
          >
            This Week
          </Button>
          <Button
            onClick={() => handleQuickFilter('thisMonth')}
            variant={filterType === 'thisMonth' ? 'callout' : 'outline'}
            className="w-1/3"
          >
            This Month
          </Button>
        </ButtonGroup>
        <ButtonGroup className="w-full">
          <Button
            onClick={() => handleQuickFilter('nextWeek')}
            variant={filterType === 'nextWeek' ? 'callout' : 'outline'}
            className="w-1/3"
          >
            Next Week
          </Button>
          <Button
            onClick={() => handleQuickFilter('nextMonth')}
            variant={filterType === 'nextMonth' ? 'callout' : 'outline'}
            className="w-1/3"
          >
            Next Month
          </Button>
          <Button
            onClick={() => handleQuickFilter('custom')}
            variant={filterType === 'custom' ? 'callout' : 'outline'}
            className="w-1/3"
          >
            Custom
          </Button>
        </ButtonGroup>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Checkbox
          id="hidePastEvents"
          checked={hidePastEvents}
          onCheckedChange={(checked: boolean) => handleHidePastEventsChange(checked)}
          disabled={['upcoming', 'nextWeek', 'nextMonth'].includes(filterType)}
        />
        <Label htmlFor="hidePastEvents">Hide past events</Label>
      </div>

      {filterType === 'custom' && (
        <>
          {/* Custom Date Range */}
          <div>
            <h4>Custom Date Range</h4>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Start Date</label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => updateDateSelection('custom', e.target.value, customEnd)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">End Date</label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => updateDateSelection('custom', customStart, e.target.value)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
