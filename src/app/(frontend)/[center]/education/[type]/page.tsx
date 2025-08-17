import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next/types'
import { getPayload, type Where } from 'payload'

import { EventCard } from '@/components/EventCard'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { POSTS_LIMIT } from '@/utilities/constants'

type Args = {
  params: Promise<{
    center: string
    type: string
  }>
  searchParams: Promise<{ [key: string]: string }>
}

export default async function EventTypePage({ params, searchParams }: Args) {
  const { center, type } = await params
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams?.page || '1')

  const payload = await getPayload({ config: configPromise })

  // Get the event type
  const eventTypeResult = await payload.find({
    collection: 'event-types',
    depth: 1,
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: type,
          },
        },
        {
          'tenant.slug': {
            equals: center,
          },
        },
      ],
    },
  })

  if (!eventTypeResult.docs.length) {
    notFound()
  }

  const eventType = eventTypeResult.docs[0]

  // Get events of this type
  const whereClause: Where = {
    'tenant.slug': {
      equals: center,
    },
    'eventType.slug': {
      equals: type,
    },
    _status: {
      equals: 'published',
    },
  }

  // Default to showing future events
  const showPastEvents = resolvedSearchParams?.showPast === 'true'
  if (!showPastEvents) {
    whereClause.startDate = {
      greater_than_equal: new Date().toISOString(),
    }
  }

  const events = await payload.find({
    collection: 'events',
    depth: 2,
    limit: POSTS_LIMIT,
    page,
    where: whereClause,
    sort: showPastEvents ? '-startDate' : 'startDate',
  })

  return (
    <div className="container py-16">
      {/* Header */}
      <div className="mb-12">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <a href={`/${center}`} className="hover:text-gray-700">
                Home
              </a>
            </li>
            <li>/</li>
            <li>
              <a href={`/${center}/education`} className="hover:text-gray-700">
                Education
              </a>
            </li>
            <li>/</li>
            <li className="text-gray-900">{eventType.title}</li>
          </ol>
        </nav>

        <div className="flex items-center gap-4 mb-6">
          {eventType.icon && (
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">
                {eventType.icon === 'course' && '🎓'}
                {eventType.icon === 'workshop' && '🛠️'}
                {eventType.icon === 'awareness' && '⚠️'}
                {eventType.icon === 'fundraiser' && '💝'}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold">{eventType.title}</h1>
            {eventType.description && (
              <p className="text-xl text-gray-600 mt-2">{eventType.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            {showPastEvents ? 'Past Events' : 'Upcoming Events'}
          </h2>

          {/* Toggle for showing past events */}
          <div className="flex gap-4">
            <a
              href={`/${center}/education/${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showPastEvents
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </a>
            <a
              href={`/${center}/education/${type}?showPast=true`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showPastEvents
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Past Events
            </a>
          </div>
        </div>

        {events.docs.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.docs.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="vertical"
                  showGroup={true}
                  showType={false}
                  showDate={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {events.totalPages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <PageRange
                  collectionLabels={{
                    plural: 'Events',
                    singular: 'Event',
                  }}
                  currentPage={events.page || 1}
                  limit={POSTS_LIMIT}
                  totalDocs={events.totalDocs || 0}
                />

                <Pagination page={events.page || 1} totalPages={events.totalPages || 1} />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {showPastEvents
                ? `No past ${eventType.title.toLowerCase()} events found.`
                : `No upcoming ${eventType.title.toLowerCase()} events scheduled.`}
            </p>
            {!showPastEvents && (
              <p className="text-gray-400 text-sm mt-2">
                Check back later for new events or{' '}
                <a
                  href={`/${center}/education/${type}?showPast=true`}
                  className="text-blue-600 hover:underline"
                >
                  browse past events
                </a>
                .
              </p>
            )}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">Interested in {eventType.title}?</h3>
        <p className="text-gray-600 mb-6">
          Stay updated on new events and educational opportunities.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href={`/${center}/events`}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Events
          </a>
          <a
            href={`/${center}/contact`}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { center, type } = await params

  const payload = await getPayload({ config: configPromise })

  const eventType = await payload.find({
    collection: 'event-types',
    depth: 1,
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: type,
          },
        },
        {
          'tenant.slug': {
            equals: center,
          },
        },
      ],
    },
  })

  if (!eventType.docs.length) {
    return {
      title: 'Event Type Not Found',
    }
  }

  const eventTypeDoc = eventType.docs[0]

  return {
    title: `${eventTypeDoc.title} - Education`,
    description:
      eventTypeDoc.description || `Learn about ${eventTypeDoc.title} events and opportunities.`,
    openGraph: {
      title: `${eventTypeDoc.title} - Education`,
      description:
        eventTypeDoc.description || `Learn about ${eventTypeDoc.title} events and opportunities.`,
    },
  }
}
