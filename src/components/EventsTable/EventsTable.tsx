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
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'

export function EventTable({ events = [] }: { events: Event[] }) {
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'asc' })
  const [displayCount, setDisplayCount] = useState(10)

  const ITEMS_PER_LOAD = 10

  // Determine status based on event data
  const getStatus = (event: Event) => {
    // Check if registration deadline has passed
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline)
      if (deadline < new Date()) {
        return { label: 'Closed', color: 'bg-slate-600' }
      }
    }

    // Check if event has passed
    if (event.startDate) {
      const startDate = new Date(event.startDate)
      if (startDate < new Date()) {
        return { label: 'Past', color: 'bg-gray-400' }
      }
    }

    if (event.cost && event.cost > 0) {
      return { label: 'Paid', color: 'bg-slate-600' }
    }
    if (event.location?.isVirtual) {
      return { label: 'Virtual', color: 'bg-blue-500' }
    }
    return { label: 'Open', color: 'bg-green-500' }
  }

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    }
  }

  // Get display address
  const getAddress = (event: Event) => {
    if (event.location?.isVirtual) {
      return 'Virtual Event'
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
      return 'Virtual'
    }
    const { placeName, city, state } = event.location || {}
    if (placeName) return placeName
    if (city && state) return `${city}, ${state}`
    return 'TBA'
  }

  // Get in-person status for sorting
  const getInPersonValue = (event: Event) => {
    return !event.location?.isVirtual ? 1 : 0
  }

  // Sort function
  const sortedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof Event]
      let bValue = b[sortConfig.key as keyof Event]

      // Handle special cases
      if (sortConfig.key === 'location') {
        aValue = getInPersonValue(a)
        bValue = getInPersonValue(b)
      } else if (sortConfig.key === 'type') {
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
    <div className="w-full">
      <div className="border-2 border-blue-500 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-32">
                <SortableHeader label="Date" sortKey="startDate" />
              </TableHead>
              <TableHead className="w-24">
                <SortableHeader label="Time" sortKey="startDate" />
              </TableHead>
              <TableHead>
                <SortableHeader label="Name" sortKey="title" />
              </TableHead>
              <TableHead className="w-24">
                <SortableHeader label="Status" sortKey="type" />
              </TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-20 text-center">
                <SortableHeader label="In-Person" sortKey="location" />
              </TableHead>
              <TableHead className="w-24 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedEvents.map((event) => {
              const { date, time } = formatDateTime(event.startDate)
              const status = getStatus(event)
              const inPerson = !event.location?.isVirtual

              return (
                <TableRow key={event.id} className="hover:bg-gray-50 transition">
                  <TableCell className="text-sm">{date}</TableCell>
                  <TableCell className="text-sm">{time}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">
                    <a href={`#${event.id}`} className="text-blue-600 hover:underline">
                      {event.title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{getAddress(event)}</TableCell>
                  <TableCell className="text-sm">{getLocation(event)}</TableCell>
                  <TableCell className="text-center">
                    {inPerson && <span className="text-lg">✓</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {event.registrationUrl ? (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-lime-400 hover:bg-lime-500 text-black font-semibold text-sm rounded transition inline-block"
                      >
                        Register
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

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
