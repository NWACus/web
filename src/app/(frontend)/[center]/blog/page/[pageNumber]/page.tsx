import type { Metadata, ResolvedMetadata } from 'next/types'

import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostCollection } from '@/components/PostCollection'
import { POSTS_LIMIT } from '@/utilities/constants'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { PostsSort } from '../../posts-sort'
import { PostsTags } from '../../posts-tags'

export const revalidate = 600

type Args = {
  params: Promise<{
    center: string
    pageNumber: string
  }>
  searchParams: Promise<{ [key: string]: string }>
}

export default async function Page({ params: paramsPromise, searchParams }: Args) {
  const resolvedSearchParams = await searchParams
  const sort = resolvedSearchParams?.sort || '-publishedAt'
  const selectedTag = resolvedSearchParams?.tags

  const { center, pageNumber } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: POSTS_LIMIT,
    page: sanitizedPageNumber,
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
      <div className="container mb-16 flex flex-col-reverse md:flex-row flex-1 gap-6">
        <div className="grow">
          <PostCollection posts={posts.docs} />
        </div>

        {/* Sorting and filters */}
        <div className="flex flex-col gap-4 shrink-0 justify-between md:justify-start md:w-[300px]">
          <PostsSort initialSort={sort} />
          {tags.docs.length > 1 && <PostsTags tags={tags.docs} />}
        </div>
      </div>

      {/* Pagination */}
      {posts.totalPages > 1 && posts.page && (
        <div className="container mb-4">
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

export async function generateMetadata(
  { params }: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = (await parent) as Metadata
  const { pageNumber } = await params

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  return {
    title: `Blog Page ${pageNumber} | ${parentTitle}`,
    alternates: {
      canonical: `/blog/page/${pageNumber}`,
    },
    openGraph: {
      ...parentOg,
      title: `Blog Page ${pageNumber} | ${parentTitle}`,
      url: `/blog/page/${pageNumber}`,
    },
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'posts',
  })

  const totalPages = Math.ceil(totalDocs / 10)

  const pages: { pageNumber: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) })
  }

  return pages
}
