import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, Where } from 'payload'
import { cache } from 'react'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { generateMeta } from '@/utilities/generateMeta'

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
    // Need where clause to ignore autosave bug (https://github.com/NWACus/web/pull/204)
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  const params: PathArgs[] = []
  for (const page of pages.docs) {
    if (typeof page.tenant === 'number') {
      payload.logger.error(`got number for page tenant: ${JSON.stringify(page.tenant)}`)
      continue
    }
    if (page.tenant) {
      params.push({ center: page.tenant.slug, slug: page.slug })
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

export default async function Page({ params: paramsPromise }: Args) {
  const payload = await getPayload({ config: configPromise })
  const { isEnabled: draft } = await draftMode()
  const { center, slug } = await paramsPromise
  const url = '/' + center + '/' + slug

  const page: PageType | null = await queryPageBySlug({
    center: center,
    slug: slug,
  })

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { layout } = page

  return (
    <article className="pt-16 pb-24">
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
  const { center, slug } = await paramsPromise
  const page = await queryPageBySlug({
    center: center,
    slug: slug,
  })

  return generateMeta({ doc: page })
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
    overrideAccess: draft,
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
