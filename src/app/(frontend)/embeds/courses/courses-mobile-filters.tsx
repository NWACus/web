'use client'

import { Button } from '@/components/ui/button'
import { ChevronDown, Filter, FilterX } from 'lucide-react'
import { useState } from 'react'
import { CoursesAffinityFilter } from './courses-affinity-filter'
import { CoursesDateFilter } from './courses-date-filter'
import { CoursesLocationFilter } from './courses-location-filter'
import { CoursesProviderFilter } from './courses-provider-filter'
import { CoursesTravelFilter } from './courses-travel-filter'
import { CoursesTypeFilter } from './courses-type-filter'

type Provider = {
  id: number
  name: string
}

type Props = {
  courseCount: number
  providers: Provider[]
  hasActiveFilters: boolean
  startDate: string
  endDate: string
}

export const CoursesMobileFilters = ({
  courseCount,
  providers,
  hasActiveFilters,
  startDate,
  endDate,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(true)
  const [typeOpen, setTypeOpen] = useState(false)
  const [providerOpen, setProviderOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [affinityOpen, setAffinityOpen] = useState(false)
  const [travelOpen, setTravelOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        aria-label="Open filters"
        className="w-full sm:w-1/2"
      >
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
          {/* Date Range */}
          <div className="border-b">
            <div
              onClick={() => setDateOpen(!dateOpen)}
              className="w-full flex items-center justify-between py-3 transition-colors"
            >
              <h3 className="font-semibold">Date Range</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${dateOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {dateOpen && (
              <div className="pb-4">
                <CoursesDateFilter startDate={startDate} endDate={endDate} />
              </div>
            )}
          </div>

          {/* Course Type */}
          <div className="border-b">
            <div
              onClick={() => setTypeOpen(!typeOpen)}
              className="w-full flex items-center justify-between py-3 transition-colors"
            >
              <h3 className="font-semibold">Course Type</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${typeOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {typeOpen && (
              <div className="pb-4">
                <CoursesTypeFilter />
              </div>
            )}
          </div>

          {/* Provider */}
          <div className="border-b">
            <div
              onClick={() => setProviderOpen(!providerOpen)}
              className="w-full flex items-center justify-between py-3 transition-colors"
            >
              <h3 className="font-semibold">Provider</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${providerOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {providerOpen && (
              <div className="pb-4">
                <CoursesProviderFilter providers={providers} />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="border-b">
            <div
              onClick={() => setLocationOpen(!locationOpen)}
              className="w-full flex items-center justify-between py-3 transition-colors"
            >
              <h3 className="font-semibold">Location</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${locationOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {locationOpen && (
              <div className="pb-4">
                <CoursesLocationFilter />
              </div>
            )}
          </div>

          {/* Affinity Groups */}
          <div className="border-b">
            <div
              onClick={() => setAffinityOpen(!affinityOpen)}
              className="w-full flex items-center justify-between py-3 transition-colors"
            >
              <h3 className="font-semibold">Affinity Group</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${affinityOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {affinityOpen && (
              <div className="pb-4">
                <CoursesAffinityFilter />
              </div>
            )}
          </div>

          {/* Mode of Travel */}
          <div className="border-b">
            <div
              onClick={() => setTravelOpen(!travelOpen)}
              className="w-full flex items-center justify-between py-3 transition-colors"
            >
              <h3 className="font-semibold">Mode of Travel</h3>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${travelOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {travelOpen && (
              <div className="pb-4">
                <CoursesTravelFilter />
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 px-4 py-4 border-t bg-white">
          <Button variant="callout" onClick={() => setIsOpen(false)} className="w-full px-4 py-3">
            Show {courseCount} courses
          </Button>
        </div>
      </div>
    </>
  )
}
