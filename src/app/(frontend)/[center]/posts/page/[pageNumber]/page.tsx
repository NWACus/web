import type { Metadata } from 'next/types'

import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostCollection } from '@/components/PostCollection'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

export const revalidate = 600

type Args = {
  params: Promise<{
    center: string
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    page: sanitizedPageNumber,
  })

  return (
    <div className="pt-24 pb-24">
      <div>
        <div className="container mb-16 flex flex-col-reverse md:flex-row flex-1 gap-6">
          <div className="grow">
            {posts && posts?.totalDocs > 0 ? (
              <PostCollection posts={posts.docs} />
            ) : (
              <h3>There are no posts matching these results.</h3>
            )}
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
          limit={12}
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
  const { center, pageNumber } = await params
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
      title: `Avalanche Center Posts Page ${pageNumber || ''}`,
    }
  }
  return {
    title: `${tenant.docs[0].name} - Posts Page ${pageNumber || ''}`,
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
