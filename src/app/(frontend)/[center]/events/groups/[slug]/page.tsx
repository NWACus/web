import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next/types'
import { getPayload } from 'payload'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { EventCollection } from '@/components/EventCollection'
import RichText from '@/components/RichText'
import { EventGroup } from '@/payload-types'
import { POSTS_LIMIT } from '@/utilities/constants'
import { EventGroupFilters } from './EventGroupFilters'

type Args = {
  params: Promise<{
    center: string
    slug: string
  }>
  searchParams: Promise<{ [key: string]: string }>
}

export default async function EventGroupPage({ params, searchParams }: Args) {
  const { center, slug } = await params
  const resolvedSearchParams = await searchParams
  const sort = resolvedSearchParams?.sort || 'startDate'
  const showPastEvents = resolvedSearchParams?.showPast === 'true'

  const payload = await getPayload({ config: configPromise })

  // Get the event group
  const eventGroup = await payload.find({
    collection: 'event-groups',
    depth: 2,
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
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  if (!eventGroup.docs.length) {
    notFound()
  }

  const groupDoc = eventGroup.docs[0] as EventGroup

  // Get events in this group
  const whereClause: any = {
    'tenant.slug': {
      equals: center,
    },
    _status: {
      equals: 'published',
    },
    'eventGroups.id': {
      equals: groupDoc.id,
    },
  }

  // Add future events filter (default behavior)
  if (!showPastEvents) {
    whereClause.startDate = {
      greater_than_equal: new Date().toISOString(),
    }
  }

  const events = await payload.find({
    collection: 'events',
    depth: 2,
    limit: POSTS_LIMIT,
    where: whereClause,
    sort,
  })

  return (
    <div className="pt-4 pb-24">
      <div className="container max-w-6xl">
        {/* Breadcrumbs */}
        <nav className="text-sm breadcrumbs mb-6">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <a href={`/${center}/events`} className="hover:text-gray-700">
                Events
              </a>
            </li>
            <li>/</li>
            <li>
              <a href={`/${center}/events/groups`} className="hover:text-gray-700">
                Groups
              </a>
            </li>
            <li>/</li>
            <li className="text-gray-900">{groupDoc.title}</li>
          </ol>
        </nav>

        {/* Group Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">{groupDoc.title}</h1>

          {groupDoc.excerpt && <p className="text-xl text-gray-600 mb-6">{groupDoc.excerpt}</p>}

          {/* Featured Image */}
          {groupDoc.featuredImage &&
            typeof groupDoc.featuredImage === 'object' &&
            groupDoc.featuredImage.url && (
              <div className="mb-8">
                <img
                  src={groupDoc.featuredImage.url}
                  alt={groupDoc.featuredImage.alt || ''}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

          {/* Rich Description */}
          {groupDoc.description && (
            <div className="mb-8">
              <RichText data={groupDoc.description} enableGutter={false} enableProse={true} />
            </div>
          )}
        </div>

        {/* Custom Content Blocks */}
        {groupDoc.content && Array.isArray(groupDoc.content) && groupDoc.content.length > 0 && (
          <div className="mb-12">
            <RenderBlocks blocks={groupDoc.content} payload={payload} />
          </div>
        )}

        {/* Events Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              {showPastEvents ? 'All Events' : 'Upcoming Events'}
            </h2>

            <EventGroupFilters showPastEvents={showPastEvents} sort={sort} />
          </div>

          <EventCollection events={events.docs} />

          {events.docs.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showPastEvents ? 'No events found' : 'No upcoming events'}
              </h3>
              <p className="text-gray-600">
                {showPastEvents
                  ? 'There are no events in this group yet.'
                  : 'There are no upcoming events in this group. Check back soon or view past events.'}
              </p>
            </div>
          )}
        </div>

        {/* Back to Events Link */}
        <div className="text-center">
          <a
            href={`/${center}/events`}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← View All Events
          </a>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { center, slug } = await params

  const payload = await getPayload({ config: configPromise })

  const eventGroup = await payload.find({
    collection: 'event-groups',
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
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  if (!eventGroup.docs.length) {
    return {}
  }

  const groupDoc = eventGroup.docs[0]

  return {
    title: `${groupDoc.title} Events`,
    description: groupDoc.excerpt || `Events in the ${groupDoc.title} category`,
    openGraph: {
      title: `${groupDoc.title} Events`,
      description: groupDoc.excerpt || `Events in the ${groupDoc.title} category`,
      images:
        groupDoc.featuredImage &&
        typeof groupDoc.featuredImage === 'object' &&
        groupDoc.featuredImage.url
          ? [{ url: groupDoc.featuredImage.url }]
          : [],
    },
  }
}
