import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, Where } from 'payload'
import { cache } from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { generateMetaForPage } from '@/utilities/generateMeta'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    limit: 1000,
    pagination: false,
    depth: 2,
    select: {
      tenant: true,
      slug: true,
    },
  })

  // TODO: use same logic as header to walk the tree and find all pages

  const params: PathArgs[] = []
  for (const post of pages.docs) {
    if (typeof post.tenant === 'number') {
      payload.logger.error(`got number for page tenant: ${JSON.stringify(post.tenant)}`)
      continue
    }
    if (post.tenant) {
      params.push({ center: post.tenant.slug, segments: [post.slug] })
    }
  }

  return params
}

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
  segments: string[]
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { center, segments } = await paramsPromise
  const url = '/' + [center, ...segments].join('/')
  const payload = await getPayload({ config: configPromise })

  const page = await queryPageBySlug({
    center: center,
    slug: segments[segments.length - 1],
  })

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { layout } = page

  return (
    <article className="pt-4 pb-24">
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <div className="container mb-8">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{page.title}</h1>
        </div>
      </div>
      <RenderBlocks blocks={layout} payload={payload} />
    </article>
  )
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<PathArgs>
}): Promise<Metadata> {
  const { center, segments } = await paramsPromise
  const page = await queryPageBySlug({
    center: center,
    slug: segments[segments.length - 1],
  })

  return generateMetaForPage({ center, doc: page, slugs: segments })
}

const queryPageBySlug = cache(async ({ center, slug }: { center: string; slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const conditions: Where[] = [
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
  ]

  if (!draft) {
    conditions.push({
      _status: {
        equals: 'published',
      },
    })
  }

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    depth: 99,
    populate: {
      tenants: {
        slug: true,
        name: true,
      },
    },
    where: {
      and: conditions,
    },
  })

  return result.docs?.[0] || null
})
