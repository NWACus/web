'use client'

import { EventType } from '@/collections/Events/constants'
import { Button } from '@/components/ui/button'
import { ChevronDown, Filter, FilterX } from 'lucide-react'
import { useState } from 'react'
import { EventsDatePicker } from './events-date-filter'
import { EventsTypeFilter } from './events-type-filter'

type Props = {
  eventCount: number
  types: EventType[]
  hasActiveFilters: boolean
}

export const EventsMobileFilters = ({ eventCount, types, hasActiveFilters }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(true)
  const [dateOpen, setDateOpen] = useState(true)

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} aria-label="Open filters">
        <div className="flex items-center gap-2">
          <span>Filters</span>
          {hasActiveFilters ? <FilterX width={16} /> : <Filter width={16} />}
        </div>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-lg transition-transform duration-300 ease-out h-[90vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-12 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="border-b">
            <div
              onClick={() => setTypeOpen(!typeOpen)}
              className="w-full flex items-center justify-between py-3  transition-colors"
            >
              <h3 className="font-semibold">Event Type</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${typeOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {typeOpen && (
              <div className="pb-4">
                <EventsTypeFilter types={types} />
              </div>
            )}
          </div>

          <div className="border-b">
            <div
              onClick={() => setDateOpen(!dateOpen)}
              className="w-full flex items-center justify-between py-3  transition-colors"
            >
              <h3 className="font-semibold">Date Range</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${dateOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {dateOpen && (
              <div className="pb-4">
                <EventsDatePicker startDate="" endDate="" />
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 px-4 py-4 border-t bg-white">
          <Button variant="callout" onClick={() => setIsOpen(false)} className="w-full px-4 py-3">
            Show {eventCount} events
          </Button>
        </div>
      </div>
    </>
  )
}
