import configPromise from '@payload-config'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { getPayload, Where } from 'payload'
import { Suspense } from 'react'

import { EventCollection } from '@/components/EventCollection'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { EVENTS_LIMIT } from '@/utilities/constants'
import { notFound } from 'next/navigation'
import { EventsFilters } from './events-filters'

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
  const selectedSubTypes = resolvedSearchParams?.subtypes?.split(',').filter(Boolean)

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

  const whereConditions: Where = {
    'tenant.slug': {
      equals: center,
    },
  }

  if (selectedTypes && selectedTypes.length > 0) {
    whereConditions['eventType.id'] = {
      in: selectedTypes,
    }
  }

  if (selectedSubTypes && selectedSubTypes.length > 0) {
    whereConditions['eventSubType.id'] = {
      in: selectedSubTypes,
    }
  }

  const events = await payload.find({
    collection: 'events',
    depth: 2,
    limit: EVENTS_LIMIT,
    where: whereConditions,
  })

  const eventTypes = await payload.find({
    collection: 'eventTypes',
    depth: 1,
    limit: 99,
    pagination: false,
    sort: 'name',
  })

  const eventSubTypes = await payload.find({
    collection: 'eventSubTypes',
    depth: 1,
    limit: 99,
    pagination: false,
    sort: 'name',
  })

  return (
    <div className="pt-4">
      <div className="container md:max-lg:max-w-5xl mb-16 flex flex-col-reverse md:flex-row flex-1 gap-10 md:gap-16">
        <div className="grow">
          <Suspense fallback={<div>Loading events...</div>}>
            <EventCollection events={events.docs} />
          </Suspense>
        </div>

        <div className="flex flex-col shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px]">
          <Suspense fallback={<div>Loading filters...</div>}>
            <EventsFilters eventTypes={eventTypes.docs} eventSubTypes={eventSubTypes.docs} />
          </Suspense>
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
