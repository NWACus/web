import configPromise from '@payload-config'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { getPayload, Where } from 'payload'

import { eventSubTypesData, eventTypesData } from '@/collections/Events/constants'
import { EventCollection } from '@/components/EventCollection'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { EVENTS_LIMIT } from '@/utilities/constants'
import { notFound } from 'next/navigation'
import { EventsDatePicker } from '../../events-date-filter'
import { EventsTypeFilter } from '../../events-type-filter'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

type Args = {
  params: Promise<{
    center: string
    pageNumber: string
  }>
  searchParams: Promise<{ [key: string]: string }>
}

export default async function Page({ params, searchParams }: Args) {
  const { center, pageNumber } = await params
  const resolvedSearchParams = await searchParams
  const selectedTypes = resolvedSearchParams?.types?.split(',').filter(Boolean)
  const selectedSubTypes = resolvedSearchParams?.subtypes?.split(',').filter(Boolean)
  const selectedStartDate = resolvedSearchParams?.startDate
  const selectedEndDate = resolvedSearchParams?.endDate
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
  const orConditions: Where[] = []

  if (selectedTypes?.length) {
    orConditions.push({ type: { in: selectedTypes } })
  }

  if (selectedSubTypes?.length) {
    orConditions.push({ subType: { in: selectedSubTypes } })
  }

  if (selectedStartDate && selectedEndDate) {
    conditions.push({
      startDate: {
        greater_than_equal: selectedStartDate,
        less_than_equal: selectedEndDate,
      },
    })
  }

  if (orConditions.length > 0) {
    conditions.push({ or: orConditions })
  }

  const whereConditions: Where = { and: conditions }
  const events = await payload.find({
    collection: 'events',
    depth: 2,
    limit: EVENTS_LIMIT,
    page: parseInt(pageNumber),
    where: whereConditions,
    sort: 'startDate',
  })

  return (
    <div className="pt-4">
      <div className="container md:max-lg:max-w-5xl mb-16 flex flex-col-reverse md:flex-row flex-1 gap-10 md:gap-16">
        <div className="grow">
          <EventCollection events={events.docs} />
        </div>

        <div className="flex flex-col shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px]">
          <EventsTypeFilter types={eventTypesData} subTypes={eventSubTypesData} />
          <EventsDatePicker startDate={selectedStartDate} endDate={selectedEndDate} />{' '}
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
