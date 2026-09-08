'use client'

import { BackgroundColorWrapper } from '@/components/BackgroundColorWrapper'
import { ButtonLink } from '@/components/ButtonLink'
import RichText from '@/components/RichText'
import type { BlogListBlock as BlogListBlockProps } from '@/payload-types'
import { filterValidPublishedRelationships } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { BlogListPosts } from './BlogListPosts'
import { useDynamicPosts } from './useDynamicPosts'

type BlogListComponentProps = BlogListBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

export const BlogListBlockComponent = (args: BlogListComponentProps) => {
  const {
    heading,
    belowHeadingContent,
    backgroundColor,
    className,
    isLayoutBlock = true,
    postOptions,
  } = args

  const { staticPosts } = args.staticOptions || {}
  const isDynamic = postOptions === 'dynamic'

  const {
    posts: dynamicPosts,
    status,
    error,
    postsPageParams,
  } = useDynamicPosts(args.dynamicOptions || {}, isDynamic)

  const posts = filterValidPublishedRelationships(isDynamic ? dynamicPosts : staticPosts)

  return (
    <BackgroundColorWrapper
      backgroundColor={backgroundColor}
      isLayoutBlock={isLayoutBlock}
      containerClassName={className}
    >
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
            posts.length > 1 && '@3xl:grid-cols-2 @6xl:grid-cols-3',
          )}
        >
          <BlogListPosts posts={posts} status={isDynamic ? status : 'ready'} error={error} />
        </div>
        {isDynamic && (
          <ButtonLink href={`/blog?${postsPageParams}`} className="not-prose md:self-start">
            View all {heading}
          </ButtonLink>
        )}
      </div>
    </BackgroundColorWrapper>
  )
}
