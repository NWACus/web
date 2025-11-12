import { getPosts } from '@/actions/getPosts'
import { getTags } from '@/actions/getTags'
import { PostsList } from '@/components/PostsList'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { createLoader, parseAsString, SearchParams } from 'nuqs/server'
import { BlogTagsFilter } from './blog-tags-filter'
import { PostsSort } from './posts-sort'

const blogSearchParams = {
  sort: parseAsString.withDefault('-publishedAt'),
  tags: parseAsString,
}

const loadBlogSearchParams = createLoader(blogSearchParams)

type Args = {
  params: Promise<{
    center: string
  }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params
  const { sort, tags } = await loadBlogSearchParams(searchParams)

  const filters = {
    tags,
    sort,
    center,
  }

  const { posts, hasMore, error } = await getPosts(filters)

  const { tags: tagsList } = await getTags(center)

  return (
    <div className="pt-4">
      <div className="container md:max-lg:max-w-5xl mb-16 flex flex-col-reverse md:flex-row flex-1 gap-10 md:gap-16">
        <div className="grow">
          <PostsList
            initialPosts={posts}
            initialHasMore={hasMore}
            initialError={error}
            center={center}
            defaultSort={sort}
          />
        </div>

        {/* Sorting and filters */}
        <div className="flex flex-col shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px]">
          <PostsSort initialSort={sort} />
          {tagsList.length > 1 && <BlogTagsFilter tags={tagsList} />}
        </div>
      </div>
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
