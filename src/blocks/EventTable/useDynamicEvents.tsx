'use client'

import type { Event, EventTableBlock as EventTableBlockProps } from '@/payload-types'
import { useEffect, useState } from 'react'

type UseEventsProps = EventTableBlockProps['dynamicOptions'] & {
  tenant?: number | { id?: number } | null
}
export const useDynamicEvents = ({
  tenant,
  filterByEventTypes,
  filterByEventGroups,
  filterByEventTags,
  showUpcomingOnly,
  maxEvents,
}: UseEventsProps) => {
  // ... rest of code
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const tenantId = typeof tenant === 'number' ? tenant : (tenant as { id?: number })?.id
        if (!tenantId) return

        const params = new URLSearchParams({
          tenantId: String(tenantId),
          limit: String(maxEvents || 4),
          depth: '1',
        })

        if (filterByEventTypes?.length) {
          params.append('types', filterByEventTypes.join(','))
        }

        if (filterByEventGroups?.length) {
          const groupIds = filterByEventGroups
            .map((g) => (typeof g === 'object' ? g.id : g))
            .filter(Boolean)
          if (groupIds.length) {
            params.append('groups', groupIds.join(','))
          }
        }

        if (filterByEventTags?.length) {
          const tagIds = filterByEventTags
            .map((t) => (typeof t === 'object' ? t.id : t))
            .filter(Boolean)
          if (tagIds.length) {
            params.append('tags', tagIds.join(','))
          }
        }

        if (showUpcomingOnly) {
          params.append('upcomingOnly', 'true')
        }

        const response = await fetch(`/api/events?${params.toString()}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }

        const data = await response.json()
        setEvents(data.docs || [])
      } catch (err) {
        console.error('[useEvents Error]:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [
    filterByEventTypes,
    filterByEventGroups,
    filterByEventTags,
    showUpcomingOnly,
    maxEvents,
    tenant,
  ])

  return { events, loading, error }
}
