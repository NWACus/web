'use client'

import { Post } from '@/payload-types'

import { getAuthorInitials } from '@/utilities/getAuthorInitials'
import { format, parseISO } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export const AuthorAvatar = (props: { authors: Post['authors']; date: Post['updatedAt'] }) => {
  const { authors, date } = props

  return (
    <>
      {authors?.map((author) => {
        let initials, id, authorPhoto
        if (author && typeof author !== 'number') {
          initials = getAuthorInitials(author.name ?? '')
          id = author.id
          authorPhoto = typeof author.photo !== 'number' && author.photo.url
        }

        return (
          <div className="flex items-center mb-6" key={id}>
            <Avatar className="me-4 size-[60px]">
              <AvatarImage src={authorPhoto || '/placeholder.svg'} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              {author && typeof author !== 'number' && (
                <p className="text-sm text-brand-600"> {author.name}</p>
              )}
              {date && (
                <p className="text-xs text-brand-400">{format(parseISO(date), 'MMMM d, yyyy')}</p>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
