import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-static'
export const revalidate = 600

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
}

export default async function Page({ params }: Args) {
  const payload = await getPayload({ config: configPromise })
  const { center } = await params

  const posts = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: 12,
    select: {
      authors: true,
      description: true,
      featuredImage: true,
      meta: true,
      publishedAt: true,
      slug: true,
      title: true,
    },
    where: {
      'tenant.slug': {
        equals: center,
      },
      _status: {
        equals: 'published',
      },
    },
  })

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        {/* Add filter */}
        {/* Add sort */}
        {/* Add search */}
      </div>

      <div className="container mb-8">
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

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
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
