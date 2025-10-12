import type { Metadata, ResolvedMetadata } from 'next'

import { getCanonicalUrlForSlug } from '@/components/Header/utils'
import { Redirects } from '@/components/Redirects'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload, Where } from 'payload'
import { cache } from 'react'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { generateMetaForPage } from '@/utilities/generateMeta'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'

export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pagesRes = await payload.find({
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

  for (const page of pagesRes.docs) {
    const pageTenant = await resolveTenant(page.tenant)

    // Check if this slug exists in navigation
    // Do not generate params if slug exists in navigation
    const canonicalUrl = await getCanonicalUrlForSlug(pageTenant.slug, page.slug)
    if (!canonicalUrl) {
      params.push({ center: pageTenant.slug, slug: page.slug })
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
  const url = '/' + slug

  // Check if this slug exists in navigation and should redirect to canonical URL
  const canonicalUrl = await getCanonicalUrlForSlug(center, slug)
  if (canonicalUrl && canonicalUrl !== `/${slug}`) {
    redirect(canonicalUrl)
  }

  const page: PageType | null = await queryPageBySlug({
    center: center,
    slug: slug,
  })

  if (!page) {
    return <Redirects center={center} url={url} />
  }

  const { layout } = page

  return (
    <article className="pt-4">
      {draft && <LivePreviewListener />}

      <div className="container mb-4">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="font-bold">{page.title}</h1>
        </div>
      </div>
      <RenderBlocks blocks={layout} payload={payload} />
    </article>
  )
}

export async function generateMetadata(
  {
    params: paramsPromise,
  }: {
    params: Promise<PathArgs>
  },
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = (await parent) as Metadata
  const { center, slug } = await paramsPromise

  // Check if this slug exists in navigation, fall back to parentMeta if so
  const canonicalUrl = await getCanonicalUrlForSlug(center, slug)
  if (canonicalUrl && canonicalUrl !== `/${slug}`) {
    return parentMeta
  }

  const page = await queryPageBySlug({
    center: center,
    slug: slug,
  })

  return generateMetaForPage({ center, doc: page, parentMeta })
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
        customDomain: true,
      },
    },
    where: {
      and: conditions,
    },
  })

  return result.docs?.[0] || null
})
