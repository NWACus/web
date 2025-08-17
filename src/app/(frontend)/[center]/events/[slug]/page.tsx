import configPromise from '@payload-config'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next/types'
import { getPayload } from 'payload'

import { EventCard } from '@/components/EventCard'
import RichText from '@/components/RichText'
import { Event, EventGroup } from '@/payload-types'

type Args = {
  params: Promise<{
    center: string
    slug: string
  }>
}

export default async function EventPage({ params }: Args) {
  const { center, slug } = await params

  const payload = await getPayload({ config: configPromise })

  const event = await payload.find({
    collection: 'events',
    depth: 3,
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: slug,
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

  if (!event.docs.length) {
    notFound()
  }

  const eventDoc = event.docs[0] as Event

  // Redirect to external event URL if set
  if (eventDoc.externalEventUrl) {
    redirect(eventDoc.externalEventUrl)
  }

  // Get related events from same groups (prioritize future events)
  let relatedEvents = null
  if (eventDoc.eventGroups?.length) {
    // First try to get future events
    relatedEvents = await payload.find({
      collection: 'events',
      depth: 2,
      limit: 3,
      where: {
        and: [
          {
            id: {
              not_equals: eventDoc.id,
            },
          },
          {
            'tenant.slug': {
              equals: center,
            },
          },
          {
            _status: {
              equals: 'published',
            },
          },
          {
            'eventGroups.id': {
              in: (eventDoc.eventGroups as EventGroup[]).map((group) =>
                typeof group === 'object' ? group.id : group,
              ),
            },
          },
          {
            startDate: {
              greater_than_equal: new Date().toISOString(),
            },
          },
        ],
      },
      sort: 'startDate',
    })

    // If we don't have enough future events, get some past events too
    if (relatedEvents.docs.length < 3) {
      const pastEvents = await payload.find({
        collection: 'events',
        depth: 2,
        limit: 3 - relatedEvents.docs.length,
        where: {
          and: [
            {
              id: {
                not_equals: eventDoc.id,
              },
            },
            {
              'tenant.slug': {
                equals: center,
              },
            },
            {
              _status: {
                equals: 'published',
              },
            },
            {
              'eventGroups.id': {
                in: (eventDoc.eventGroups as EventGroup[]).map((group) =>
                  typeof group === 'object' ? group.id : group,
                ),
              },
            },
            {
              startDate: {
                less_than: new Date().toISOString(),
              },
            },
          ],
        },
        sort: '-startDate', // Most recent past events first
      })

      // Combine future and past events
      relatedEvents = {
        ...relatedEvents,
        docs: [...relatedEvents.docs, ...pastEvents.docs],
      }
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    }
  }

  const startDateTime = eventDoc.startDate ? formatDateTime(eventDoc.startDate) : null
  const endDateTime = eventDoc.endDate ? formatDateTime(eventDoc.endDate) : null
  const registrationDeadline = eventDoc.registrationDeadline
    ? formatDateTime(eventDoc.registrationDeadline)
    : null

  const eventGroups = Array.isArray(eventDoc.eventGroups) ? eventDoc.eventGroups : []
  const eventType = typeof eventDoc.eventType === 'object' ? eventDoc.eventType : null
  const instructors = Array.isArray(eventDoc.instructors) ? eventDoc.instructors : []

  return (
    <div className="pt-4 pb-24">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          {/* Breadcrumbs */}
          <nav className="text-sm breadcrumbs mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li>
                <a href={`/${center}/events`} className="hover:text-gray-700">
                  Events
                </a>
              </li>
              <li>/</li>
              <li className="text-gray-900">{eventDoc.title}</li>
            </ol>
          </nav>

          {/* Event Type and Groups */}
          <div className="flex flex-wrap gap-2 mb-4">
            {eventType && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                {eventType.title}
              </span>
            )}
            {eventGroups.map((group) => {
              const groupData = typeof group === 'object' ? group : null
              if (!groupData) return null
              return (
                <a
                  key={groupData.id}
                  href={`/${center}/events/groups/${groupData.slug}`}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {groupData.title}
                </a>
              )
            })}
          </div>

          <h1 className="text-4xl font-bold mb-4">{eventDoc.title}</h1>

          {eventDoc.excerpt && <p className="text-xl text-gray-600 mb-6">{eventDoc.excerpt}</p>}

          {/* Featured Image */}
          {eventDoc.featuredImage &&
            typeof eventDoc.featuredImage === 'object' &&
            eventDoc.featuredImage.url && (
              <div className="mb-8">
                <img
                  src={eventDoc.featuredImage.url}
                  alt={eventDoc.featuredImage.alt || ''}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Event Description */}
            {eventDoc.content && (
              <div className="mb-8">
                <RichText data={eventDoc.content} enableGutter={false} enableProse={true} />
              </div>
            )}

            {/* Instructors */}
            {instructors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Instructors</h2>
                <div className="grid gap-4">
                  {instructors.map((instructor) => {
                    const instructorData = typeof instructor === 'object' ? instructor : null
                    if (!instructorData) return null
                    return (
                      <div key={instructorData.id} className="flex items-center gap-4">
                        {instructorData.photo &&
                          typeof instructorData.photo === 'object' &&
                          instructorData.photo.url && (
                            <img
                              src={instructorData.photo.url}
                              alt={instructorData.name || 'Instructor photo'}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          )}
                        <div>
                          <h3 className="font-semibold">{instructorData.name}</h3>
                          {instructorData.title && (
                            <p className="text-gray-600">{instructorData.title}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Actions */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Registration</h3>

              {/* Cost */}
              <div className="mb-4">
                <span className="text-2xl font-bold">
                  {typeof eventDoc.cost === 'number' ? (
                    eventDoc.cost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <span>${eventDoc.cost}</span>
                    )
                  ) : (
                    'Contact for pricing'
                  )}
                </span>
              </div>

              {/* Registration Deadline */}
              {registrationDeadline && (
                <div className="mb-4 text-sm text-gray-600">
                  <strong>Registration deadline:</strong>
                  <br />
                  {registrationDeadline.date} at {registrationDeadline.time}
                </div>
              )}

              {/* Capacity */}
              {typeof eventDoc.capacity === 'number' && (
                <div className="mb-4 text-sm text-gray-600">
                  <strong>Capacity:</strong> {eventDoc.capacity} participants
                </div>
              )}

              {/* Registration Button */}
              {eventDoc.registrationUrl && (
                <a
                  href={eventDoc.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register Now
                </a>
              )}
            </div>

            {/* Event Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>

              {/* Date & Time */}
              {startDateTime && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-1">When</h4>
                  <div className="text-sm">
                    <div>{startDateTime.date}</div>
                    <div>{startDateTime.time}</div>
                    {endDateTime && endDateTime.date !== startDateTime.date && (
                      <div className="mt-1">
                        <span className="text-gray-500">to</span>
                        <div>{endDateTime.date}</div>
                        <div>{endDateTime.time}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {eventDoc.location && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-1">Where</h4>
                  <div className="text-sm">
                    {eventDoc.location.isVirtual ? (
                      <div>Virtual Event</div>
                    ) : (
                      <>
                        {eventDoc.location.venue && <div>{eventDoc.location.venue}</div>}
                        {eventDoc.location.address && (
                          <div className="text-gray-600">{eventDoc.location.address}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Timezone */}
              {eventDoc.timezone && (
                <div className="text-xs text-gray-500">Times shown in {eventDoc.timezone}</div>
              )}
            </div>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents?.docs && relatedEvents.docs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Related Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.docs.map((relatedEvent) => (
                <EventCard
                  key={relatedEvent.id}
                  event={relatedEvent}
                  variant="vertical"
                  showGroup={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { center, slug } = await params

  const payload = await getPayload({ config: configPromise })

  const event = await payload.find({
    collection: 'events',
    depth: 1,
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: slug,
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

  if (!event.docs.length) {
    return {}
  }

  const eventDoc = event.docs[0]

  return {
    title: eventDoc.title,
    description: eventDoc.excerpt || `Join us for ${eventDoc.title}`,
    openGraph: {
      title: eventDoc.title,
      description: eventDoc.excerpt || `Join us for ${eventDoc.title}`,
      images:
        eventDoc.featuredImage &&
        typeof eventDoc.featuredImage === 'object' &&
        eventDoc.featuredImage.url
          ? [{ url: eventDoc.featuredImage.url }]
          : [],
    },
  }
}
