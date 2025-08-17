import configPromise from '@payload-config'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { EventCollection } from '@/components/EventCollection'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { POSTS_LIMIT } from '@/utilities/constants'
import { EventsFilters } from './events-filters'
import { EventsSort } from './events-sort'

type Args = {
  params: Promise<{
    center: string[]
  }>
  searchParams: Promise<{ [key: string]: string }>
}

export default async function EventsPage({ params, searchParams }: Args) {
  const { center } = await params
  const resolvedSearchParams = await searchParams
  const sort = resolvedSearchParams?.sort || 'startDate'
  const selectedEventGroups = resolvedSearchParams?.eventGroups?.split(',').filter(Boolean) || []
  const selectedEventTypes = resolvedSearchParams?.eventTypes?.split(',').filter(Boolean) || []
  const showPastEvents = resolvedSearchParams?.showPast === 'true'
  const searchQuery = resolvedSearchParams?.search || ''

  const payload = await getPayload({ config: configPromise })

  // Build where clause
  const whereClause: any = {
    'tenant.slug': {
      equals: center,
    },
    _status: {
      equals: 'published',
    },
  }

  // Add event groups filter
  if (selectedEventGroups.length > 0) {
    whereClause['eventGroups.slug'] = {
      in: selectedEventGroups,
    }
  }

  // Add event types filter
  if (selectedEventTypes.length > 0) {
    whereClause['eventType.slug'] = {
      in: selectedEventTypes,
    }
  }

  // Add future events filter (default behavior)
  if (!showPastEvents) {
    whereClause.startDate = {
      greater_than_equal: new Date().toISOString(),
    }
  }

  // Add search filter
  if (searchQuery) {
    whereClause.or = [
      {
        title: {
          contains: searchQuery,
        },
      },
      {
        excerpt: {
          contains: searchQuery,
        },
      },
    ]
  }

  const events = await payload.find({
    collection: 'events',
    depth: 2,
    limit: POSTS_LIMIT,
    where: whereClause,
    sort,
  })

  // Get event groups for filtering
  const eventGroups = await payload.find({
    collection: 'event-groups',
    depth: 1,
    limit: 99,
    pagination: false,
    where: {
      'tenant.slug': {
        equals: center,
      },
      _status: {
        equals: 'published',
      },
    },
    sort: 'title',
  })

  // Get event types for filtering
  const eventTypes = await payload.find({
    collection: 'event-types',
    depth: 1,
    limit: 99,
    pagination: false,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
    sort: 'title',
  })

  return (
    <div className="pt-4 pb-24">
      <div className="container md:max-lg:max-w-5xl mb-16">
        <h1 className="text-4xl font-bold mb-8">Events</h1>

        <div className="flex flex-col-reverse md:flex-row flex-1 gap-6">
          <div className="grow">
            <Suspense fallback={<div>Loading events...</div>}>
              <EventCollection events={events.docs} />
            </Suspense>
          </div>

          {/* Sorting and filters */}
          <div className="flex flex-col gap-4 shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px]">
            <Suspense fallback={<div>Loading filters...</div>}>
              <EventsSort initialSort={sort} />
              <EventsFilters
                eventGroups={eventGroups.docs}
                eventTypes={eventTypes.docs}
                selectedEventGroups={selectedEventGroups}
                selectedEventTypes={selectedEventTypes}
                showPastEvents={showPastEvents}
                searchQuery={searchQuery}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {events.totalPages > 1 && events.page && (
        <div className="container mb-8">
          <Pagination page={events.page} totalPages={events.totalPages} />
          <PageRange
            collectionLabels={{
              plural: 'Events',
              singular: 'Event',
            }}
            currentPage={events.page}
            limit={POSTS_LIMIT}
            totalDocs={events.totalDocs}
          />
        </div>
      )}
    </div>
  )
}

export async function generateMetadata(
  _props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = (await parent) as Metadata

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  return {
    title: `Events | ${parentTitle}`,
    alternates: {
      canonical: '/events',
    },
    openGraph: {
      ...parentOg,
      title: `Events | ${parentTitle}`,
      url: '/events',
    },
  }
}
