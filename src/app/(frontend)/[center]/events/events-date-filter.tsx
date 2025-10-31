'use client'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useEffect, useState } from 'react'

type Props = {
  startDate: string
  endDate: string
}

export const EventsDatePicker = ({ startDate, endDate }: Props) => {
  const [filterType, setFilterType] = useState('')
  const [customStart, setCustomStart] = useState(startDate || '')
  const [customEnd, setCustomEnd] = useState(endDate || '')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const today = new Date()
  const currentYear = today.getFullYear()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getDateRange = (type: string) => {
    const now = new Date()
    let start, end

    switch (type) {
      case 'thisWeek': {
        const dayOfWeek = now.getDay()
        start = new Date(now)
        start.setDate(now.getDate() - dayOfWeek)
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        break
      }
      case 'nextWeek': {
        const dayOfWeek = now.getDay()
        start = new Date(now)
        start.setDate(now.getDate() + (7 - dayOfWeek))
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        break
      }
      case 'thisMonth': {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      }
      case 'nextMonth': {
        start = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        break
      }
      default:
        return null
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }

  const handleQuickFilter = (type: string) => {
    const range = getDateRange(type)
    if (range) {
      setFilterType(type)
      setCustomStart(range.start)
      setCustomEnd(range.end)
    }
  }

  const handleMonthYearChange = (month: string, year: string) => {
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    const start = new Date(yearNum, monthNum, 1).toISOString().split('T')[0]
    const end = new Date(yearNum, monthNum + 1, 0).toISOString().split('T')[0]
    setFilterType('monthSelect')
    setSelectedMonth(month)
    setSelectedYear(year)
    setCustomStart(start)
    setCustomEnd(end)
  }

  const handleCustomDateChange = (start: string, end: string) => {
    setFilterType('custom')
    setCustomStart(start)
    setCustomEnd(end)
  }

  const clearFilter = () => {
    setFilterType('')
    setCustomStart('')
    setCustomEnd('')

    const params = new URLSearchParams(searchParams.toString())
    params.delete('startDate')
    params.delete('endDate')
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (customStart && customEnd) {
      params.set('startDate', customStart)
      params.set('endDate', customEnd)
    } else {
      params.delete('startDate')
      params.delete('endDate')
    }

    router.push(`${pathname}?${params.toString()}`)
  }, [customStart, customEnd, pathname, router, searchParams])

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Filter by date</h3>
        {filterType && (
          <Button onClick={clearFilter} variant="ghost">
            <X width={16} />
          </Button>
        )}
      </div>
      <hr className="p-2" />

      <div className="mb-4">
        <ButtonGroup className="w-full">
          <Button
            onClick={() => handleQuickFilter('thisWeek')}
            variant={filterType === 'thisWeek' ? 'callout' : 'outline'}
            className="w-1/2"
          >
            This Week
          </Button>
          <Button
            onClick={() => handleQuickFilter('nextWeek')}
            variant={filterType === 'nextWeek' ? 'callout' : 'outline'}
            className="w-1/2"
          >
            Next Week
          </Button>
        </ButtonGroup>
        <ButtonGroup className="w-full">
          <Button
            onClick={() => handleQuickFilter('thisMonth')}
            variant={filterType === 'thisMonth' ? 'callout' : 'outline'}
            className="w-1/2"
          >
            This Month
          </Button>
          <Button
            onClick={() => handleQuickFilter('nextMonth')}
            variant={filterType === 'nextMonth' ? 'callout' : 'outline'}
            className="w-1/2"
          >
            Next Month
          </Button>
        </ButtonGroup>
      </div>

      {/* Month/Year Selection */}
      <div className="mb-4">
        <h4>Select Month & Year</h4>
        <div className="flex gap-3">
          <Select
            value={selectedMonth}
            onValueChange={(month) => handleMonthYearChange(month, selectedYear)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, idx) => (
                <SelectItem key={month} value={idx.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear}
            onValueChange={(year) => handleMonthYearChange(selectedMonth, year)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Date Range */}
      <div>
        <h4>Custom Date Range</h4>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Start Date</label>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => handleCustomDateChange(e.target.value, customEnd)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">End Date</label>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => handleCustomDateChange(customStart, e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
