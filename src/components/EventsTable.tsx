import { Calendar, Edit, MapPin, Trash2 } from 'lucide-react'
import Link from 'next/link'

import type { Event } from '@/payload-types'

import { eventSubTypesData, eventTypesData } from '@/collections/Events/constants'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

interface EventsTableProps {
  events: Event[]
}

export const EventsTable = ({ events }: EventsTableProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
    return date.toLocaleDateString('en-US', options)
  }

  const getLocationText = (location: Event['location']) => {
    if (!location) return null
    if (location.isVirtual) return 'Virtual'
    if (location.placeName) return location.placeName
    if (location.city && location.state) return `${location.city}, ${location.state}`
    if (location.city) return location.city
    if (location.state) return location.state
    return null
  }

  const getDateRange = (event: Event) => {
    if (!event.startDate) return 'No date'

    const startDate = formatDate(event.startDate)

    if (event.endDate && event.endDate !== event.startDate) {
      const endDate = formatDate(event.endDate)
      return `${startDate} - ${endDate}`
    }

    return startDate
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Date(s)</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No events found
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => {
              const locationText = getLocationText(event.location)

              const eventTypeName = event.type
                ? eventTypesData.find((et) => et.value === event.type)?.label
                : null
              const eventSubTypeName = event.subType
                ? eventSubTypesData.find((et) => et.value === event.subType)?.label
                : null

              const typeDisplayText =
                eventTypeName && eventSubTypeName
                  ? `${eventTypeName} > ${eventSubTypeName}`
                  : eventSubTypeName || eventTypeName

              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {getDateRange(event)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {locationText ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {locationText}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{typeDisplayText || '-'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`#edit-${event.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
