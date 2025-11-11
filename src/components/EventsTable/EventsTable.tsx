'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Event } from '@/payload-types'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight, ChevronsUpDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CMSLink } from '../Link'

export function EventTable({ events = [] }: { events: Event[] }) {
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'asc' })
  const [displayCount, setDisplayCount] = useState(10)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const ITEMS_PER_LOAD = 10

  // Determine status based on event data
  const getStatus = (event: Event) => {
    const now = new Date()
    const isVirtual = event.location?.isVirtual || false
    const isPast = event.startDate ? new Date(event.startDate) < now : false
    const isRegistrationClosed = event.registrationDeadline
      ? new Date(event.registrationDeadline) < now
      : false

    // Determine label and color
    let label = 'Open'
    let color = 'bg-brand-400'

    if (isRegistrationClosed) {
      label = 'Closed'
      color = 'bg-slate-600'
    } else if (isPast) {
      label = 'Past'
      color = 'bg-gray-400'
    } else if (isVirtual) {
      label = 'Virtual'
      color = 'bg-secondary'
    }

    return {
      label,
      color,
      isVirtual,
      isPast,
      isRegistrationClosed,
    }
  }

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: format(date, 'MMM d, yyyy'), // "Nov 10, 2025"
      time: format(date, 'h:mm a'),
    }
  }

  // Get display address
  const getAddress = (event: Event) => {
    if (event.location?.isVirtual) {
      return ''
    }
    const { address, city, state, zip } = event.location || {}
    if (address) return address
    if (city && state) return `${city}, ${state}`
    if (zip) return zip
    return 'TBA'
  }

  // Get display location (city/venue)
  const getLocation = (event: Event) => {
    if (event.location?.isVirtual) {
      return 'Online'
    }
    const { placeName, city, state } = event.location || {}
    if (placeName) return placeName
    if (city && state) return `${city}, ${state}`
    return 'TBA'
  }

  // Sort function
  const sortedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof Event]
      let bValue = b[sortConfig.key as keyof Event]

      // Handle special cases
      if (sortConfig.key === 'type') {
        aValue = getStatus(a).label
        bValue = getStatus(b).label
      }

      if (aValue == null) return 1
      if (bValue == null) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [events, sortConfig])

  const displayedEvents = sortedEvents.slice(0, displayCount)
  const hasMore = displayCount < sortedEvents.length

  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      })
    } else {
      setSortConfig({ key, direction: 'asc' })
    }
  }

  const toggleRow = (eventId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedRows(newExpanded)
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: string }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition"
    >
      {label}
      <SortIcon columnKey={sortKey} />
    </button>
  )

  if (!events || events.length === 0) {
    return <div className="text-center py-8 text-gray-500">No events found</div>
  }

  return (
    <div className="w-full not-prose overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="p-2 w-4 lg:hidden"></TableHead>
            <TableHead className="flex-1 min-w-0">
              <SortableHeader label="Date" sortKey="startDate" />
            </TableHead>
            <TableHead className="sm:flex-1 sm:min-w-0">
              <SortableHeader label="Name" sortKey="title" />
            </TableHead>
            <TableHead className="hidden sm:table-cell flex-1 min-w-0">
              <SortableHeader label="Status" sortKey="type" />
            </TableHead>
            <TableHead className="hidden lg:table-cell flex-1 min-w-0">Location</TableHead>
            <TableHead className="hidden lg:table-cell flex-1 min-w-0">
              <SortableHeader label="Cost" sortKey="cost" />
            </TableHead>
            <TableHead className="flex-1 min-w-0 text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedEvents.map((event) => {
            const { date, time } = formatDateTime(event.startDate)
            const status = getStatus(event)
            const { isVirtual, isPast, isRegistrationClosed } = status
            const isExpanded = expandedRows.has(String(event.id))

            return (
              <>
                <TableRow
                  key={event.id}
                  className="hover:bg-gray-50 transition cursor-pointer lg:cursor-auto"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      toggleRow(String(event.id))
                    }
                  }}
                >
                  <TableCell className="p-2 w-4 lg:hidden">
                    <ChevronRight
                      className={`w-4 h-4 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </TableCell>
                  <TableCell className="text-sm px-1 sm:px-2">
                    <div>
                      <div className="font-medium">{date}</div>
                      <div className="text-gray-500 text-xs">{time}</div>
                    </div>
                  </TableCell>

                  {/* Name */}
                  <TableCell className="text-sm max-w-xs">{event.title}</TableCell>

                  {/* Status label */}
                  <TableCell className="hidden sm:table-cell px-1 sm:px-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="hidden lg:table-cell text-sm">
                    <div>
                      <div className="font-medium">{getLocation(event)}</div>
                      <div className="text-gray-500 text-xs">{getAddress(event)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center">
                    {event.cost === 0 ? 'Free' : `$${event.cost}`}
                  </TableCell>

                  {/* Register button */}
                  <TableCell className="text-center px-1 sm:px-2">
                    {event.registrationUrl && !isPast && !isRegistrationClosed ? (
                      <CMSLink
                        appearance="default"
                        size="sm"
                        className="group-hover:opacity-90 transition-opacity text-sm"
                        url={event.registrationUrl}
                      >
                        Register
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ml-1 sm:ml-2 -mt-0.5 text-muted hidden sm:inline" />
                      </CMSLink>
                    ) : isPast || isRegistrationClosed ? (
                      <Button variant="default" disabled={true}>
                        {isPast && 'Past event'}
                        {isRegistrationClosed && 'Registration closed'}
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>

                {/* Expanded row for details on smaller screens */}
                {isExpanded && (
                  <TableRow className="bg-gray-50 lg:hidden">
                    <TableCell colSpan={1}></TableCell>
                    <TableCell colSpan={4} className="py-4">
                      <div className="columns-2 space-y-3">
                        {/* Location */}
                        <div className="break-inside-avoid">
                          <h4 className="font-semibold text-gray-900">Location</h4>
                          <p className="text-sm text-gray-600">{getLocation(event)}</p>
                          {getAddress(event) && (
                            <p className="text-sm text-gray-500">{getAddress(event)}</p>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="grid grid-cols-2">
                          <div className="sm:hidden break-inside-avoid">
                            <h4 className="font-semibold text-gray-900">Status</h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </div>

                          {isVirtual && (
                            <div className="break-inside-avoid">
                              <h4 className="font-semibold text-gray-900">Virtual</h4>
                              <p className="text-sm text-gray-600">Yes</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_LOAD)}
            variant="default"
          >
            Load More
          </Button>
        </div>
      )}

      {/* Results info */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {displayedEvents.length} of {sortedEvents.length} events
      </div>
    </div>
  )
}
