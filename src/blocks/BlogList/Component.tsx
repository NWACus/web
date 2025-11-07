import { PostPreviewSmallRow } from '@/components/PostPreviewSmallRow'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import type { BlogListBlock as BlogListBlockProps, Post } from '@/payload-types'
import {
  filterValidPublishedRelationships,
  filterValidRelationships,
} from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import Link from 'next/link'

type BlogListComponentProps = BlogListBlockProps & {
  className?: string
  wrapInContainer?: boolean
}

export const BlogListBlockComponent = async (args: BlogListComponentProps) => {
  const { heading, belowHeadingContent, backgroundColor, className, wrapInContainer = true } = args

  const { filterByTags, sortBy, queriedPosts } = args.dynamicOptions || {}
  const { staticPosts } = args.staticOptions || {}

  let posts: Post[] = filterValidPublishedRelationships(staticPosts)

  const hasStaticPosts = staticPosts && staticPosts.length > 0

  if (!staticPosts || (staticPosts.length === 0 && queriedPosts && queriedPosts.length > 0)) {
    posts = filterValidPublishedRelationships(queriedPosts)
  }

  const filterByTagsSlugs = filterValidRelationships(filterByTags).map(({ slug }) => slug)

  const blogLinkQueryParams = new URLSearchParams()
  if (sortBy !== undefined) {
    blogLinkQueryParams.set('sort', sortBy)
  }

  if (filterByTagsSlugs && filterByTagsSlugs.length > 0) {
    blogLinkQueryParams.set('tags', filterByTagsSlugs.join(','))
  }

  if (!posts) {
    return null
  }

  const bgColorClass = `bg-${backgroundColor}`

  return (
    <div className={cn(wrapInContainer && bgColorClass && `${bgColorClass}`)}>
      <div className={cn(wrapInContainer && 'container py-10', '@container', className)}>
        <div className="bg-card text-card-foreground p-6 border shadow rounded-lg flex flex-col gap-6">
          <div className="flex flex-col justify-start gap-1">
            {heading && (
              <div className="prose md:prose-md dark:prose-invert">
                <h2>{heading}</h2>
              </div>
            )}
            {belowHeadingContent && (
              <div>
                <RichText data={belowHeadingContent} enableGutter={false} />
              </div>
            )}
          </div>
          <div
            className={cn(
              'grid gap-4 lg:gap-6 not-prose max-h-[400px] overflow-y-auto',
              posts && posts.length > 1 && '@3xl:grid-cols-2 @6xl:grid-cols-3',
            )}
          >
            {posts && posts?.length > 0 ? (
              posts?.map((post, index) => (
                <PostPreviewSmallRow doc={post} key={`${post.id}__${index}`} />
              ))
            ) : (
              <h3>There are no posts matching these results.</h3>
            )}
          </div>
          {!hasStaticPosts && (
            <Button asChild className="not-prose md:self-start">
              <Link href={`/blog?${blogLinkQueryParams.toString()}`}>View all {heading}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
