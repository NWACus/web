'use client'
import { cn } from '@/utilities/ui'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { AuthorAvatar } from '../AuthorAvatar'
import { ImageMedia } from '../Media/ImageMedia'
import { Button } from '../ui/button'

export type PostPreviewData = Pick<
  Post,
  'authors' | 'description' | 'featuredImage' | 'publishedAt' | 'slug' | 'title'
>

export const PostPreview = (props: {
  alignItems?: 'center'
  className?: string
  doc?: PostPreviewData
  title?: string
}) => {
  const { className, doc, title: titleFromProps } = props

  if (!doc) return null

  const { authors, description, featuredImage, publishedAt, slug, title } = doc

  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space

  // NOTE: this component should be rendered inside of an element with the '@container' class on it
  return (
    <Link href={`/blog/${slug}`} className={cn('group no-underline flex flex-grow', className)}>
      <article
        className={cn(
          'flex flex-col @md:flex-row w-full bg-card text-card-foreground border rounded-lg  shadow-sm hover:shadow-md transition-shadow overflow-hidden',
          className,
        )}
      >
        <div className="w-full @md:w-56 @xl:w-72 @2xl:w-80 @md:flex-shrink-0 h-48 @md:h-auto overflow-hidden">
          {featuredImage && typeof featuredImage !== 'number' && (
            <ImageMedia
              imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              resource={featuredImage}
              pictureClassName="w-full h-full"
            />
          )}
        </div>
        <div className="flex flex-col justify-between px-6 py-4 flex-grow border-t md:border-t-0 md:border-l">
          <div>
            {titleToUse && (
              <div className="mb-3">
                {authors && <AuthorAvatar authors={authors ?? []} date={publishedAt ?? ''} />}
                <h3 className="text-lg @lg:text-xl font-semibold mt-2 mb-2 leading-tight group-hover:underline">
                  {titleToUse}
                </h3>
              </div>
            )}
            {description && (
              <p className="text-muted-foreground text-sm @lg:text-base line-clamp-2 @xl:line-clamp-3 mb-4">
                {sanitizedDescription}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200"
          >
            Read More
          </Button>
        </div>
      </article>
    </Link>
  )
}
