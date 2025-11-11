import configPromise from '@payload-config'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { getPayload, Where } from 'payload'

import { eventTypesData, QUICK_DATE_FILTERS } from '@/collections/Events/constants'
import { EventCollection } from '@/components/EventCollection'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { EVENTS_LIMIT } from '@/utilities/constants'
import { notFound } from 'next/navigation'
import { EventsDatePicker } from './events-date-filter'
import { EventsMobileFilters } from './events-mobile-filters'
import { EventsTypeFilter } from './events-type-filter'

type Args = {
  params: Promise<{
    center: string
  }>
  searchParams: Promise<{ [key: string]: string }>
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params
  const resolvedSearchParams = await searchParams
  const selectedTypes = resolvedSearchParams?.types?.split(',').filter(Boolean)
  let selectedStartDate = resolvedSearchParams?.startDate || ''
  let selectedEndDate = resolvedSearchParams?.endDate || ''

  // Apply "upcoming" filter by default if no dates are provided
  if (!selectedStartDate && !selectedEndDate) {
    const upcomingFilter = QUICK_DATE_FILTERS.find((f) => f.id === 'upcoming')
    if (upcomingFilter) {
      selectedStartDate = upcomingFilter.startDate()
      selectedEndDate = upcomingFilter.endDate() || ''
    }
  }

  const payload = await getPayload({ config: configPromise })

  const navigationRes = await payload.find({
    collection: 'navigations',
    depth: 0,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })

  const navigation = navigationRes.docs[0]

  if (navigation.events?.options?.enabled === false) {
    return notFound()
  }

  const conditions: Where[] = [{ 'tenant.slug': { equals: center } }]

  if (selectedTypes?.length) {
    conditions.push({ type: { in: selectedTypes } })
  }

  if (selectedStartDate && selectedEndDate) {
    conditions.push({
      startDate: {
        greater_than_equal: selectedStartDate,
        less_than_equal: selectedEndDate,
      },
    })
  } else if (selectedStartDate) {
    conditions.push({
      startDate: {
        greater_than_equal: selectedStartDate,
      },
    })
  } else if (selectedEndDate) {
    conditions.push({
      startDate: {
        less_than_equal: selectedEndDate,
      },
    })
  }

  const whereConditions: Where = { and: conditions }
  const events = await payload.find({
    collection: 'events',
    depth: 2,
    limit: EVENTS_LIMIT,
    where: whereConditions,
    sort: 'startDate',
  })

  const hasActiveFilters =
    (selectedTypes && selectedTypes.length > 0) || selectedStartDate || selectedEndDate

  return (
    <div className="pt-4">
      <div className="container md:max-lg:max-w-5xl mb-16 flex flex-col md:flex-row flex-1 gap-6 md:gap-10 lg:gap-16">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <EventsMobileFilters
            types={eventTypesData}
            hasActiveFilters={Boolean(hasActiveFilters)}
            eventCount={events.totalDocs}
          />
        </div>

        {/* Main Content */}
        <div className="grow order-2 md:order-1">
          <EventCollection events={events.docs} />
        </div>

        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden md:flex flex-col shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px] order-1 md:order-2">
          <EventsTypeFilter types={eventTypesData} />
          <EventsDatePicker startDate={selectedStartDate} endDate={selectedEndDate} />
        </div>
      </div>

      {events.totalPages > 1 && events.page && (
        <div className="container mb-4">
          <Pagination
            page={events.page}
            totalPages={events.totalPages}
            relativePath="/events/page"
          />
          <PageRange
            collectionLabels={{
              plural: 'Events',
              singular: 'Event',
            }}
            currentPage={events.page}
            limit={EVENTS_LIMIT}
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
