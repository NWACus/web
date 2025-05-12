import type { Metadata } from 'next/types'

import { CardPostData } from '@/components/Card'
import { CollectionArchive } from '@/components/CollectionArchive'
import { Search } from '@/search/Component'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type PathArgs = {
  center: string
}

type Args = {
  params: Promise<PathArgs>
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { q: query } = await searchParamsPromise
  const { center } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'search',
    depth: 1,
    limit: 12,
    overrideAccess: true,
    select: {
      title: true,
      slug: true,
      meta: true,
    },
    // pagination: false reduces overhead if you don't need totalDocs
    pagination: false,
    ...(query
      ? {
          where: {
            and: [
              {
                'tenant.slug': {
                  equals: center,
                },
              },
              {
                or: [
                  {
                    title: {
                      like: query,
                    },
                  },
                  {
                    'meta.description': {
                      like: query,
                    },
                  },
                  {
                    'meta.title': {
                      like: query,
                    },
                  },
                  {
                    slug: {
                      like: query,
                    },
                  },
                ],
              },
            ],
          },
        }
      : {
          where: {
            'tenant.slug': {
              equals: center,
            },
          },
        }),
  })

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">Search</h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs as CardPostData[]} />
      ) : (
        <div className="container">No results found.</div>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Search`,
  }
}
