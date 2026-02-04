import type { Metadata, ResolvedMetadata } from 'next'

import { getCanonicalUrlForPath, getCanonicalUrlForSlug } from '@/components/Header/utils'
import { Redirects } from '@/components/Redirects'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, Where } from 'payload'
import { cache } from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { generateMetaForPage } from '@/utilities/generateMeta'
import { normalizePath } from '@/utilities/path'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'

export const dynamic = 'force-static'
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
    // Only use published documents (not added by default)
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
    // Generate params if slug exists in navigation
    const canonicalUrl = await getCanonicalUrlForSlug(pageTenant.slug, page.slug)

    // DEBUG LOGGING
    console.log('🔍 PAGE FOUND')
    console.log('   Tenant:', pageTenant)
    console.log('   Page slug:', page.slug)
    console.log('   Canonical URL:', canonicalUrl)

    if (canonicalUrl) {
      params.push({ center: pageTenant.slug, segments: normalizePath(canonicalUrl).split('/') })
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
  const { center, segments } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  // Check if this path exists in navigation and get canonical URL
  const fullPath = `/${segments.join('/')}`
  const canonicalUrl = await getCanonicalUrlForPath(center, fullPath)
  console.log('🔍 PAGE')
  console.log('   Full path:', fullPath)
  console.log('   Canonical URL:', canonicalUrl)
  if (!canonicalUrl) {
    return <Redirects center={center} url={fullPath} />
  }

  const page = await queryPageBySlug({
    center: center,
    slug: segments[segments.length - 1],
  })

  if (!page) {
    return <Redirects center={center} url={fullPath} />
  }

  const { layout } = page

  return (
    <article className="pt-4">
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
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const parentMeta = (await parent) as Metadata
  const { center, segments } = await paramsPromise

  // Validate path exists in navigation before generating metadata
  const fullPath = `/${segments.join('/')}`
  const canonicalUrl = await getCanonicalUrlForPath(center, fullPath)

  if (!canonicalUrl) {
    return parentMeta
  }

  const page = await queryPageBySlug({
    center: center,
    slug: segments[segments.length - 1],
  })

  return generateMetaForPage({ center, doc: page, slugs: segments, parentMeta })
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
