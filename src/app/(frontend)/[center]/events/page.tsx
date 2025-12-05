import configPromise from '@payload-config'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { getPayload } from 'payload'

import { EventsList } from '@/components/EventsList'
import { FiltersTotalProvider } from '@/contexts/FiltersTotalContext'
import { getEventGroups } from '@/utilities/queries/getEventGroups'
import { getEvents } from '@/utilities/queries/getEvents'
import { getEventTags } from '@/utilities/queries/getEventTags'
import { getEventTypes } from '@/utilities/queries/getEventTypes'
import { notFound } from 'next/navigation'
import { createLoader, parseAsArrayOf, parseAsString, SearchParams } from 'nuqs/server'
import { EventsFilters } from './EventsFilters'
import { EventsMobileFilters } from './EventsMobileFilters'

const eventsSearchParams = {
  types: parseAsArrayOf(parseAsString),
  startDate: parseAsString.withDefault(''),
  endDate: parseAsString.withDefault(''),
  groups: parseAsArrayOf(parseAsString),
  tags: parseAsArrayOf(parseAsString),
  modesOfTravel: parseAsArrayOf(parseAsString),
}

const loadEventsSearchParams = createLoader(eventsSearchParams)

type Args = {
  params: Promise<{
    center: string
  }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params
  const { types, startDate, endDate, groups, tags, modesOfTravel } =
    await loadEventsSearchParams(searchParams)

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

  const filters = {
    types,
    startDate,
    endDate,
    groups,
    tags,
    modesOfTravel,
    center,
  }

  const { events, hasMore, total, error } = await getEvents(filters)
  const { eventTypes } = await getEventTypes({ center })
  const { eventGroups } = await getEventGroups({ center })
  const { eventTags } = await getEventTags({ center })

  const hasActiveFilters = Boolean(types || groups || tags || modesOfTravel || startDate || endDate)

  return (
    <FiltersTotalProvider initialTotal={total}>
      <div className="pt-4">
        <div className="container md:max-lg:max-w-5xl mb-16 flex flex-col md:flex-row flex-1 gap-6 md:gap-10 lg:gap-16">
          <div className="md:hidden">
            <EventsMobileFilters
              types={eventTypes}
              groups={eventGroups}
              tags={eventTags}
              hasActiveFilters={hasActiveFilters}
              startDate={startDate}
              endDate={endDate}
            />
          </div>

          <div className="grow order-2 md:order-1">
            <EventsList
              initialEvents={events}
              initialHasMore={hasMore}
              initialError={error}
              center={center}
            />
          </div>

          <div className="hidden md:flex flex-col shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px] order-1 md:order-2">
            <EventsFilters
              startDate={startDate}
              endDate={endDate}
              types={eventTypes}
              groups={eventGroups}
              tags={eventTags}
            />
          </div>
        </div>
      </div>
    </FiltersTotalProvider>
  )
}

export async function generateMetadata(
  _props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
