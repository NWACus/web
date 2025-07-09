'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardPostData = Pick<Post, 'description' | 'featuredImage' | 'slug' | 'title'>

export const Card = (props: {
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: 'posts'
  title?: string
}) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, title: titleFromProps } = props

  const { description, featuredImage, slug, title } = doc || {}

  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space
  const href = `/${relationTo === 'posts' ? 'blog' : relationTo}/${slug}`

  return (
    <article
      className={cn(
        'border border-border rounded-lg overflow-hidden bg-card hover:cursor-pointer',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative w-full">
        {featuredImage && typeof featuredImage !== 'number' && (
          <Media imgClassName="w-full" resource={featuredImage} size="33vw" />
        )}
      </div>
      <div className="p-4">
        {titleToUse && (
          <div className="prose">
            <h3>
              <Link className="not-prose" href={href} ref={link.ref}>
                {titleToUse}
              </Link>
            </h3>
          </div>
        )}
        {description && <div className="mt-2">{description && <p>{sanitizedDescription}</p>}</div>}
      </div>
    </article>
  )
}
