import { PostsList } from '@/components/PostsList'
import { FiltersTotalProvider } from '@/contexts/FiltersTotalContext'
import { getPosts } from '@/utilities/queries/getPosts'
import { getTags } from '@/utilities/queries/getTags'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { createLoader, parseAsString, SearchParams } from 'nuqs/server'
import { PostsFilters } from './PostsFilters'
import { PostsMobileFilters } from './PostsMobileFilters'

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

  const { posts, hasMore, total, error } = await getPosts(filters)

  const { tags: tagsList } = await getTags(center)

  const hasActiveFilters = Boolean(tags || sort !== '-publishedAt')

  return (
    <FiltersTotalProvider initialTotal={total}>
      <div className="pt-4">
        <div className="container md:max-lg:max-w-5xl mb-16 flex flex-col-reverse md:flex-row flex-1 gap-10 md:gap-16">
          <div className="grow">
            <div className="md:hidden mb-4">
              <PostsMobileFilters tags={tagsList} sort={sort} hasActiveFilters={hasActiveFilters} />
            </div>

            <PostsList
              initialPosts={posts}
              initialHasMore={hasMore}
              initialError={error}
              center={center}
              defaultSort={sort}
            />
          </div>

          <div className="hidden md:flex flex-col shrink-0 justify-between md:justify-start md:w-[240px] lg:w-[300px]">
            <PostsFilters sort={sort} tags={tagsList} />
          </div>
        </div>
      </div>
    </FiltersTotalProvider>
  )
}

export async function generateMetadata(
  props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center } = await props.params
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
      images: [{ url: `/api/${center}/og?routeTitle=Blog`, width: 1200, height: 630 }],
    },
  }
}
