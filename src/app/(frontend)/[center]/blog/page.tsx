import configPromise from '@payload-config'
import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostCollection } from '@/components/PostCollection'
import { POSTS_LIMIT } from '@/utilities/constants'
import { PostsSort } from './posts-sort'
import { PostsTags } from './posts-tags'

type Args = {
  params: Promise<{
    center: string[]
  }>
  searchParams: Promise<{ [key: string]: string }>
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params
  const resolvedSearchParams = await searchParams
  const sort = resolvedSearchParams?.sort || '-publishedAt'
  const selectedTag = resolvedSearchParams?.tags

  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: POSTS_LIMIT,
    where: {
      'tenant.slug': {
        equals: center,
      },
      _status: {
        equals: 'published',
      },
      'tags.slug': {
        in: selectedTag,
      },
    },
    sort,
  })

  const tags = await payload.find({
    collection: 'tags',
    depth: 1,
    limit: 99,
    pagination: false,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
    sort: 'slug',
  })

  return (
    <div className="pt-4 pb-24">
      <div className="container md:max-lg:max-w-5xl mb-16 flex flex-col-reverse md:flex-row flex-1 gap-6">
        <div className="grow">
          <Suspense fallback={<div>Loading posts...</div>}>
            <PostCollection posts={posts.docs} />
          </Suspense>
        </div>

        {/* Sorting and filters */}
        <div className="flex flex-col gap-4 shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px]">
          <Suspense fallback={<div>Loading filters...</div>}>
            <PostsSort initialSort={sort} />
            {tags.docs.length > 1 && <PostsTags tags={tags.docs} />}
          </Suspense>
        </div>
      </div>

      {/* Pagination */}
      {posts.totalPages > 1 && posts.page && (
        <div className="container mb-8">
          <Pagination page={posts.page} totalPages={posts.totalPages} />
          <PageRange
            collectionLabels={{
              plural: 'Posts',
              singular: 'Post',
            }}
            currentPage={posts.page}
            limit={POSTS_LIMIT}
            totalDocs={posts.totalDocs}
          />
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const { center } = await params
  const tenant = await payload.find({
    collection: 'tenants',
    select: {
      name: true,
    },
    where: {
      slug: {
        equals: center,
      },
    },
  })
  if (tenant.docs.length < 1) {
    return {
      title: `Avalanche Center Blog`,
    }
  }
  return {
    title: `${tenant.docs[0].name} - Blog`,
  }
}
