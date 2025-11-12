import configPromise from '@payload-config'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { getPayload } from 'payload'

import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostCollection } from '@/components/PostCollection'
import { POSTS_LIMIT } from '@/utilities/constants'
import { createLoader, parseAsString, SearchParams } from 'nuqs/server'
import { PostsSort } from './posts-sort'
import { PostsTags } from './posts-tags'

export const blogSearchParams = {
  sort: parseAsString.withDefault('-publishedAt'),
  tags: parseAsString,
}

export const loadBlogSearchParams = createLoader(blogSearchParams)

type Args = {
  params: Promise<{
    center: string
  }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params
  const { sort, tags: selectedTag } = await loadBlogSearchParams(searchParams)

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
    <div className="pt-4">
      <div className="container md:max-lg:max-w-5xl mb-16 flex flex-col-reverse md:flex-row flex-1 gap-10 md:gap-16">
        <div className="grow">
          <PostCollection posts={posts.docs} />
        </div>

        {/* Sorting and filters */}
        <div className="flex flex-col shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px]">
          <PostsSort initialSort={sort} />
          {tags.docs.length > 1 && <PostsTags tags={tags.docs} />}
        </div>
      </div>

      {/* Pagination */}
      {posts.totalPages > 1 && posts.page && (
        <div className="container mb-4">
          <Pagination page={posts.page} totalPages={posts.totalPages} relativePath="/blog/page" />
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

export async function generateMetadata(
  _props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = (await parent) as Metadata

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  return {
    title: `Blog | ${parentTitle}`,
    alternates: {
      canonical: '/blog',
    },
    openGraph: {
      ...parentOg,
      title: `Blog | ${parentTitle}`,
      url: '/blog',
    },
  }
}
