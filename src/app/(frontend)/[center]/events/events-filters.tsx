'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { EventGroup, EventType } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Props = {
  eventGroups: EventGroup[]
  eventTypes: EventType[]
  selectedEventGroups: string[]
  selectedEventTypes: string[]
  showPastEvents: boolean
  searchQuery: string
}

export const EventsFilters = ({
  eventGroups,
  eventTypes,
  selectedEventGroups: initialEventGroups,
  selectedEventTypes: initialEventTypes,
  showPastEvents: initialShowPast,
  searchQuery: initialSearchQuery,
}: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasUserInteracted = useRef(false)

  const [selectedEventGroups, setSelectedEventGroups] = useState<string[]>(initialEventGroups)
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(initialEventTypes)
  const [showPastEvents, setShowPastEvents] = useState<boolean>(initialShowPast)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery)

  const toggleEventGroup = (slug: string) => {
    hasUserInteracted.current = true
    setSelectedEventGroups((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  const toggleEventType = (slug: string) => {
    hasUserInteracted.current = true
    setSelectedEventTypes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  const toggleShowPast = () => {
    hasUserInteracted.current = true
    setShowPastEvents((prev) => !prev)
  }

  const handleSearchChange = (value: string) => {
    hasUserInteracted.current = true
    setSearchQuery(value)
  }

  useEffect(() => {
    if (!hasUserInteracted.current) return

    const params = new URLSearchParams(searchParams.toString())

    if (selectedEventGroups.length > 0) {
      params.set('eventGroups', selectedEventGroups.join(','))
    } else {
      params.delete('eventGroups')
    }

    if (selectedEventTypes.length > 0) {
      params.set('eventTypes', selectedEventTypes.join(','))
    } else {
      params.delete('eventTypes')
    }

    if (showPastEvents) {
      params.set('showPast', 'true')
    } else {
      params.delete('showPast')
    }

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    } else {
      params.delete('search')
    }

    router.push(`/events?${params.toString()}`)
  }, [router, searchParams, selectedEventGroups, selectedEventTypes, showPastEvents, searchQuery])

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h4 className="w-full mb-2">Search Events</h4>
        <hr className="mb-3" />
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Event Groups Filter */}
      {eventGroups.length > 0 && (
        <div>
          <h4 className="w-full mb-2">Event Groups</h4>
          <hr className="mb-3" />
          <ul className="space-y-2">
            {eventGroups.map((group) => {
              const isChecked = selectedEventGroups.includes(group.slug)
              return (
                <li key={group.slug}>
                  <div
                    className={cn(
                      'flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50',
                      { 'bg-blue-50': isChecked },
                    )}
                    onClick={() => toggleEventGroup(group.slug)}
                  >
                    <Checkbox checked={isChecked} />
                    <span className="text-sm">{group.title}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Event Types Filter */}
      {eventTypes.length > 0 && (
        <div>
          <h4 className="w-full mb-2">Event Types</h4>
          <hr className="mb-3" />
          <ul className="space-y-2">
            {eventTypes.map((type) => {
              const isChecked = selectedEventTypes.includes(type.slug)
              return (
                <li key={type.slug}>
                  <div
                    className={cn(
                      'flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50',
                      { 'bg-blue-50': isChecked },
                    )}
                    onClick={() => toggleEventType(type.slug)}
                  >
                    <Checkbox checked={isChecked} />
                    <span className="text-sm">{type.title}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Show Past Events */}
      <div>
        <h4 className="w-full mb-2">Options</h4>
        <hr className="mb-3" />
        <div
          className={cn('flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50', {
            'bg-blue-50': showPastEvents,
          })}
          onClick={toggleShowPast}
        >
          <Checkbox checked={showPastEvents} />
          <span className="text-sm">Show past events</span>
        </div>
      </div>
    </div>
  )
}
