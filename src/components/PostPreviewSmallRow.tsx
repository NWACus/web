import { cn } from '@/utilities/ui'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { getRelativeTime } from '@/utilities/getRelativeTime'
import { BookText } from 'lucide-react'
import { ImageMedia } from './Media/ImageMedia'

export const PostPreviewSmallRow = (props: { className?: string; doc?: Post }) => {
  const { className, doc } = props

  if (!doc) return null

  const { featuredImage, publishedAt, slug, title } = doc

  const relativePublishedAt = publishedAt ? getRelativeTime(publishedAt) : null

  return (
    <Link href={`/blog/${slug}`} className={cn('group', className)}>
      <article className={cn('flex gap-3', className)}>
        <div className="flex-shrink-0 overflow-hidden">
          {featuredImage && typeof featuredImage !== 'number' ? (
            <ImageMedia
              imgClassName="w-28 h-20 object-contain scale-100 group-hover:scale-110 transition-all duration-200"
              resource={featuredImage}
              size="72px"
              pictureClassName="w-28 h-20 overflow-hidden rounded aspect-square"
            />
          ) : (
            <div className="w-28 h-20 bg-muted text-muted-foreground flex justify-center items-center">
              <BookText />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <h3 className="text-lg leading-tight group-hover:underline">{title}</h3>
          {relativePublishedAt && (
            <p className="text-sm text-muted-foreground capitalize">{relativePublishedAt}</p>
          )}
        </div>
      </article>
    </Link>
  )
}
