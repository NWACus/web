import RichText from '@/components/RichText'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Media } from '@/components/Media'
import { generateMetaForEvent } from '@/utilities/generateMeta'
import { cn } from '@/utilities/ui'
import { Metadata, ResolvedMetadata } from 'next'

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

export default async function EventGroup({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { center, slug } = await paramsPromise
  const event = await queryEventBySlug({ center: center, slug: slug })

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
              <div className="prose dark:prose-invert max-w-[48rem] mx-auto">
                <h1 className="font-bold mb-2">{event.title}</h1>
              </div>
              <div className="mt-6 pt-6 border-t">{event.description}</div>
            </div>
          </div>

          {event.content && (
            <RichText className="prose mx-auto" data={event.content} enableGutter={false} />
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
    collection: 'eventGroups',
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
