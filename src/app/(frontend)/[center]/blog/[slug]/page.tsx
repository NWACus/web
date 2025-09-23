import type { Metadata, ResolvedMetadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { AuthorAvatar } from '@/components/AuthorAvatar'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import RichText from '@/components/RichText'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, Where } from 'payload'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { generateMetaForPost } from '@/utilities/generateMeta'

export const dynamicParams = true

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    pagination: false,
    depth: 3,
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
  for (const post of posts.docs) {
    if (typeof post.tenant === 'number') {
      payload.logger.error(`got number for post tenant`)
      continue
    }
    if (post.tenant) {
      params.push({ center: post.tenant.slug, slug: post.slug })
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

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { center, slug } = await paramsPromise
  const url = '/blog/' + slug
  const post = await queryPostBySlug({ center: center, slug: slug })

  if (!post) return <PayloadRedirects url={url} />

  return (
    <article className="pt-4">
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <div className="prose dark:prose-invert max-w-[48rem] mx-auto pb-8">
            <h1 className="font-bold">{post.title}</h1>
          </div>
          <div className="max-w-[48rem] mx-auto">
            <AuthorAvatar authors={post.authors} date={post.publishedAt ?? ''} />
          </div>
          <RichText
            className="prose max-w-[48rem] mx-auto"
            data={post.content}
            enableGutter={false}
          />
        </div>
      </div>
      {post.relatedPosts && post.relatedPosts.length > 0 && (
        <div className="bg-brand-500 p-16">
          <RelatedPosts
            className="flex flex-col items-center md:flex-row md:justify-center md:items-stretch gap-4 max-w-[48rem] lg:px-0"
            docs={post.relatedPosts.filter((post) => typeof post === 'object')}
          />
        </div>
      )}
    </article>
  )
}

export async function generateMetadata(
  { params: paramsPromise }: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = (await parent) as Metadata
  const { center, slug = '' } = await paramsPromise
  const post = await queryPostBySlug({ center: center, slug: slug })

  return generateMetaForPost({ center: center, doc: post, parentMeta })
}

const queryPostBySlug = async ({ center, slug }: { center: string; slug: string }) => {
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
    collection: 'posts',
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
    where: { and: conditions },
  })

  return result.docs?.[0] || null
}
