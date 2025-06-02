'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { AuthorAvatar } from '../AuthorAvatar'

export type PostPreviewHorizontalData = Pick<
  Post,
  'authors' | 'description' | 'featuredImage' | 'publishedAt' | 'slug' | 'title'
>

export const PostPreviewHorizontal = (props: {
  alignItems?: 'center'
  className?: string
  doc?: PostPreviewHorizontalData
  relationTo?: 'posts'
  title?: string
}) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, title: titleFromProps } = props

  const { authors, description, featuredImage, publishedAt, slug, title } = doc || {}

  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space
  const href = `/${relationTo}/${slug}`

  return (
    <article className={cn('flex my-6 hover:cursor-pointer', className)} ref={card.ref}>
      <div className="relative w-full flex-1">
        {featuredImage && typeof featuredImage !== 'number' && (
          <Media imgClassName="w-full" resource={featuredImage} size="33vw" />
        )}
      </div>
      <div className="ml-6 flex-1">
        {titleToUse && (
          <div className="my-4">
            <AuthorAvatar authors={authors ?? []} date={publishedAt ?? ''} />
            <h3 className="text-xl">
              <Link href={href} ref={link.ref}>
                {titleToUse}
              </Link>
            </h3>
          </div>
        )}
        {description && <div className="my-4">{description && <p>{sanitizedDescription}</p>}</div>}
        <Link href={href} ref={link.ref}>
          Read More
        </Link>
      </div>
    </article>
  )
}
