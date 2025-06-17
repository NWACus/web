import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { PostsGrid } from './posts-grid'

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
      <PostsGrid tags={tags.docs} center={center} />
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
