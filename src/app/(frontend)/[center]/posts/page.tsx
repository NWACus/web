import type { Metadata } from 'next/types'

import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostCollection } from '@/components/PostCollection'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
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
  const selectedTag = resolvedSearchParams?.tag

  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: 10,
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
    sort: 'name',
  })

  return (
    <div className="pt-24 pb-24">
      <div>
        <div className="container mb-16 flex flex-col-reverse md:flex-row flex-1 gap-6">
          <div className="grow">
            {posts.totalDocs > 0 ? (
              <PostCollection posts={posts.docs} />
            ) : (
              <h3>There are no posts matching these results.</h3>
            )}
          </div>

          {/* Sorting and filters */}
          <div className="sm:w-[280px]">
            <PostsSort initialSort={sort} />
            {tags.docs.length > 1 && <PostsTags tags={tags.docs} />}
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
              limit={10}
              totalDocs={posts.totalDocs}
            />
          </div>
        )}
      </div>
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
      title: `Avalanche Center Posts`,
    }
  }
  return {
    title: `${tenant.docs[0].name} - Posts`,
  }
}
