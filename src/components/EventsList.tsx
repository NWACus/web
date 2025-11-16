'use client'

import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import type { Event } from '@/payload-types'
import type { GetEventsResult } from '@/utilities/queries/getEvents'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createSerializer, parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { EventPreview } from './EventPreview'
import { Card } from './ui/card'

const searchParamsSerializer = createSerializer({
  offset: parseAsInteger,
  types: parseAsArrayOf(parseAsString, ','),
  startDate: parseAsString,
  endDate: parseAsString,
  groups: parseAsArrayOf(parseAsString, ','),
  tags: parseAsArrayOf(parseAsString, ','),
  modesOfTravel: parseAsArrayOf(parseAsString, ','),
})

interface EventsListProps {
  initialEvents: Event[]
  initialHasMore: boolean
  initialError?: string
  center: string
}

export const EventsList = ({
  initialEvents,
  initialHasMore,
  initialError,
  center,
}: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [offset, setOffset] = useState(initialEvents.length)
  const [hasMoreData, setHasMoreData] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const searchParams = useSearchParams()
  const previousParamsRef = useRef<string>(searchParams.toString())
  const { setTotal } = useFiltersTotalContext()

  // Rebuild filters from current URL params
  const stableFilters = useMemo(() => {
    const types = searchParams.get('types')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groups = searchParams.get('groups')
    const tags = searchParams.get('tags')
    const modesOfTravel = searchParams.get('modesOfTravel')
    return {
      center,
      types: types ? types.split(',').filter(Boolean) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      groups: groups ? groups.split(',').filter(Boolean) : null,
      tags: tags ? tags.split(',').filter(Boolean) : null,
      modesOfTravel: modesOfTravel ? modesOfTravel.split(',').filter(Boolean) : null,
    }
  }, [searchParams, center])

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  })

  // Reset events when URL search params change
  useEffect(() => {
    const currentParams = searchParams.toString()

    // Only refetch if params actually changed
    if (currentParams !== previousParamsRef.current) {
      previousParamsRef.current = currentParams

      const resetAndFetch = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const queryString = searchParamsSerializer({
            offset: 0,
            types: stableFilters.types || undefined,
            startDate: stableFilters.startDate || undefined,
            endDate: stableFilters.endDate || undefined,
            groups: stableFilters.groups || undefined,
            tags: stableFilters.tags || undefined,
            modesOfTravel: stableFilters.modesOfTravel || undefined,
          })

          const result: GetEventsResult = await fetch(`/api/${center}/events?${queryString}`).then(
            (res) => res.json(),
          )

          if (result.error) {
            setError(result.error)
            setEvents([])
            setHasMoreData(false)
            setTotal(0)
          } else {
            setEvents(result.events)
            setOffset(result.events.length)
            setHasMoreData(result.hasMore)
            setTotal(result.total)
          }
        } catch (_error) {
          setError('An unexpected error occurred. Please try again.')
        } finally {
          setIsLoading(false)
        }
      }

      resetAndFetch()
    }
  }, [searchParams, setTotal, stableFilters])

  useEffect(() => {
    if (inView && hasMoreData && !isLoading) {
      const loadMore = async () => {
        setIsLoading(true)
        try {
          const queryString = searchParamsSerializer({
            offset,
            types: stableFilters.types || undefined,
            startDate: stableFilters.startDate || undefined,
            endDate: stableFilters.endDate || undefined,
            groups: stableFilters.groups || undefined,
            tags: stableFilters.tags || undefined,
            modesOfTravel: stableFilters.modesOfTravel || undefined,
          })

          const result: GetEventsResult = await fetch(`/api/${center}/events?${queryString}`).then(
            (res) => res.json(),
          )

          if (result.error) {
            setError(result.error)
            setHasMoreData(false)
          } else {
            // Deduplicate events by ID to prevent duplicate key errors
            setEvents((prevEvents) => {
              const existingIds = new Set(prevEvents.map((event) => event.id))
              const newEvents = result.events.filter((event) => !existingIds.has(event.id))
              return [...prevEvents, ...newEvents]
            })
            setOffset((prevOffset) => prevOffset + result.events.length)
            setHasMoreData(result.hasMore)
          }
        } catch (_error) {
          setError('An unexpected error occurred while loading more events.')
          setHasMoreData(false)
        } finally {
          setIsLoading(false)
        }
      }

      loadMore()
    }
  }, [inView, hasMoreData, isLoading, offset, stableFilters])

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Error Loading Events</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (events.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No events found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="@container">
      {events.map((event) => (
        <div className="mb-8" key={event.id}>
          <EventPreview className="h-full" event={event} />
        </div>
      ))}

      {hasMoreData && (
        <div ref={ref} className="flex justify-center py-8">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}
