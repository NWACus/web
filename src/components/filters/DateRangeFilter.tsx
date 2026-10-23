'use client'

import { DatePickerField } from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import { QuickDateFilter } from '@/utilities/createQuickDateFilters'
import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import { Options, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

type DateRangeFilterProps = {
  startDate: string
  endDate: string
  quickFilters: QuickDateFilter[]
  title?: string
  titleClassName?: string
  defaultOpen?: boolean
  showBottomBorder?: boolean
}

const QUICK_FILTER_ORDER = [
  'upcoming',
  'this-week',
  'next-week',
  'this-month',
  'next-month',
  'past',
]

type Selection = { id: string; startDate: string; endDate: string }

const subscribe = () => () => {}

const matchQuickFilter = (quickFilters: QuickDateFilter[], start: string, end: string) =>
  quickFilters.find((filter) => filter.startDate() === start && (filter.endDate() || '') === end)
    ?.id ?? 'custom'

// The user's own pick wins while the URL still holds its dates, so "Custom" can sit on quick-filter dates
const resolveQuickFilter = (
  quickFilters: QuickDateFilter[],
  selection: Selection | null,
  start: string,
  end: string,
) => {
  if (!start && !end) return ''
  if (selection?.startDate === start && selection.endDate === end) return selection.id
  return matchQuickFilter(quickFilters, start, end)
}

function useDateRange(
  quickFilters: QuickDateFilter[],
  initialStartDate: string,
  initialEndDate: string,
) {
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

  const [selection, setSelection] = useState<Selection | null>(null)
  // Quick filters compute "today" in the runtime's timezone, so only match once hydrated
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  // nuqs updates before the server props catch up, so the highlight reads nuqs alone
  const quickFilter = hydrated
    ? resolveQuickFilter(quickFilters, selection, startDate, endDate)
    : ''
  const currentStart = startDate || initialStartDate
  const currentEnd = endDate || initialEndDate

  const updateDateSelection = useCallback(
    (filter: string, start: string, end: string, options?: Options) => {
      setSelection({ id: filter, startDate: start, endDate: end })
      setDateParams(
        {
          startDate: start || null,
          endDate: end || null,
        },
        options,
      )
    },
    [setDateParams],
  )

  const handleQuickFilter = useCallback(
    (filterKey: string, options?: Options) => {
      const filter = quickFilters.find((f) => f.id === filterKey)
      if (filter) {
        updateDateSelection(filterKey, filter.startDate(), filter.endDate() || '', options)
      } else {
        // Switching to the custom pickers keeps the current dates, so there's nothing to write
        setSelection({ id: filterKey, startDate, endDate })
      }
    },
    [endDate, startDate, quickFilters, updateDateSelection],
  )

  useEffect(
    function fillDefaultDates() {
      if (currentStart || currentEnd) return
      // setTimeout needed to avoid hydration race condition with nuqs
      // replace: the default isn't a user step, and an iframe's push lands in the host page's history
      const timeout = setTimeout(() => {
        handleQuickFilter('upcoming', { history: 'replace' })
      }, 0)
      return () => clearTimeout(timeout)
    },
    [currentEnd, currentStart, handleQuickFilter],
  )

  return { startDate, endDate, quickFilter, updateDateSelection, handleQuickFilter }
}

const QuickFilterButtons = ({
  quickFilters,
  quickFilter,
  onSelect,
}: {
  quickFilters: QuickDateFilter[]
  quickFilter: string
  onSelect: (filterKey: string) => void
}) => (
  <div className="mb-4 grid grid-cols-2 gap-2">
    {QUICK_FILTER_ORDER.map((id) => {
      const filter = quickFilters.find((f) => f.id === id)
      if (!filter) return null
      return (
        <Button
          key={filter.id}
          onClick={() => onSelect(filter.id)}
          variant={quickFilter === filter.id ? 'default' : 'outline'}
          aria-pressed={quickFilter === filter.id}
          className="flex-1"
        >
          {filter.label}
        </Button>
      )
    })}
  </div>
)

const DateRangeOptions = ({
  quickFilters,
  range: { startDate, endDate, quickFilter, updateDateSelection, handleQuickFilter },
}: {
  quickFilters: QuickDateFilter[]
  range: ReturnType<typeof useDateRange>
}) => (
  <div className="pb-4">
    <QuickFilterButtons
      quickFilters={quickFilters}
      quickFilter={quickFilter}
      onSelect={handleQuickFilter}
    />

    <Button
      onClick={() => handleQuickFilter('custom')}
      variant={quickFilter === 'custom' ? 'default' : 'outline'}
      aria-pressed={quickFilter === 'custom'}
      className="w-full"
    >
      Custom date range
    </Button>

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
)

const DateRangeHeader = ({
  title,
  titleClassName,
  isOpen,
  onToggle,
  showClear,
  onClear,
}: {
  title: string
  titleClassName?: string
  isOpen: boolean
  onToggle: () => void
  showClear: boolean
  onClear: () => void
}) => (
  <div
    onClick={onToggle}
    className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
  >
    <h3 className={cn('font-semibold', titleClassName)}>{title}</h3>
    <div className="flex items-center gap-2">
      {showClear && (
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onClear()
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
)

export const DateRangeFilter = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  quickFilters,
  title = 'Date Range',
  titleClassName,
  defaultOpen = true,
  showBottomBorder = true,
}: DateRangeFilterProps) => {
  const range = useDateRange(quickFilters, initialStartDate, initialEndDate)
  const { quickFilter, handleQuickFilter } = range
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={showBottomBorder ? 'border-b' : ''}>
      <div>
        <DateRangeHeader
          title={title}
          titleClassName={titleClassName}
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          showClear={Boolean(quickFilter) && quickFilter !== 'upcoming'}
          onClear={() => handleQuickFilter('upcoming')}
        />
        {isOpen && <DateRangeOptions quickFilters={quickFilters} range={range} />}
      </div>
    </div>
  )
}
