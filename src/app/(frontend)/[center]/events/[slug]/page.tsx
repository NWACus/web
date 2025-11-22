import { Redirects } from '@/components/Redirects'
import RichText from '@/components/RichText'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'

import { EventInfo } from '@/components/EventInfo'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { generateMetaForEvent } from '@/utilities/generateMeta'
import { cn } from '@/utilities/ui'
import { ExternalLink } from 'lucide-react'
import { Metadata, ResolvedMetadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const events = await payload.find({
    collection: 'events',
    limit: 1000,
    pagination: false,
    depth: 3,
    select: {
      tenant: true,
      slug: true,
    },
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  const params: PathArgs[] = []
  for (const event of events.docs) {
    if (typeof event.tenant === 'number') {
      payload.logger.error(`got number for event tenant`)
      continue
    }
    if (event.tenant) {
      params.push({ center: event.tenant.slug, slug: event.slug })
    }
  }

  return params
}

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
  slug: string
}

export default async function Event({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { center, slug } = await paramsPromise
  const url = '/events/' + slug
  const event = await queryEventBySlug({ center: center, slug: slug })

  if (!event) return <Redirects center={center} url={url} />

  // If there's an external event URL, redirect to it
  if (event.externalEventUrl && !draft) {
    redirect(event.externalEventUrl)
  }

  const isPastEvent = event.startDate && new Date(event.startDate) < new Date()
  const isRegistrationClosed =
    event.registrationDeadline && new Date(event.registrationDeadline) < new Date()

  return (
    <article className={cn('pt-4 pb-16', { 'pt-8': !event.featuredImage })}>
      {draft && <LivePreviewListener />}

      <div className="flex flex-col items-center gap-4">
        {event.featuredImage && (
          <Media
            resource={event.featuredImage}
            className="w-full absolute"
            imgClassName="w-full h-[35vh] object-cover"
          />
        )}
        <div className={cn('container z-10', { 'mt-40': event.featuredImage })}>
          <div className="max-w-[48rem] mx-auto mb-8">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="prose dark:prose-invert max-w-[48rem] mx-auto pb-4">
                <h1 className="font-bold mb-2">{event.title}</h1>
                {event.subtitle && (
                  <p className="text-xl text-muted-foreground mt-0">{event.subtitle}</p>
                )}
              </div>

              <EventInfo
                startDate={event.startDate}
                endDate={event.endDate}
                timezone={event.timezone}
                location={event.location}
                skillRating={event.skillRating}
                showLabels={true}
                className="columns-1 sm:columns-2"
                itemsClassName="break-inside-avoid mb-4"
              />

              {/* Registration Information */}
              {event.registrationUrl && (
                <div className="mt-4 pt-4 border-t">
                  {event.registrationDeadline && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Registration Deadline:{' '}
                      {formatDateTime(event.registrationDeadline, event.timezone, 'MMM d, yyyy')}
                    </p>
                  )}
                  {!isPastEvent && !isRegistrationClosed ? (
                    <Button asChild size="lg" className="w-full md:w-auto">
                      <Link href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                        Register for Event
                        <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-muted" />
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-destructive font-medium">
                      {isPastEvent ? 'This event has passed' : 'Registration is closed'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {event.content && (
            <RichText
              className="prose max-w-[48rem] mx-auto"
              data={event.content}
              enableGutter={false}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata(
  { params: paramsPromise }: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = (await parent) as Metadata
  const { center, slug = '' } = await paramsPromise
  const event = await queryEventBySlug({ center: center, slug: slug })

  return generateMetaForEvent({ center: center, doc: event, parentMeta })
}

const queryEventBySlug = async ({ center, slug }: { center: string; slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'events',
    draft,
    limit: 1,
    pagination: false,
    populate: {
      tenants: {
        slug: true,
        name: true,
        customDomain: true,
      },
    },
    where: {
      and: [
        {
          'tenant.slug': {
            equals: center,
          },
        },
        {
          slug: {
            equals: slug,
          },
        },
      ],
    },
  })

  return result.docs?.[0] || null
}
