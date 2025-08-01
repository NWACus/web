'use client'

import { Media, Post } from '@/payload-types'

import { getAuthorInitials } from '@/utilities/getAuthorInitials'
import { cn } from '@/utilities/ui'
import { format, parseISO } from 'date-fns'
import { MediaAvatar } from '../Media/AvatarImageMedia'

export const AuthorAvatar = (props: { authors: Post['authors']; date: Post['updatedAt'] }) => {
  const { authors, date } = props

  const combinedAuthorsNames: string[] = [],
    combinedAuthorsInitials: string[] = [],
    combinedAuthorsPhotos: Media[] = []
  authors.forEach((author) => {
    if (
      author &&
      typeof author !== 'number' &&
      typeof author.name === 'string' &&
      typeof author.photo !== 'number'
    ) {
      combinedAuthorsNames.push(author.name)
      combinedAuthorsInitials.push(getAuthorInitials(author.name ?? ''))
      combinedAuthorsPhotos.push(author.photo)
    }
  })

  return (
    <>
      <div className="flex items-center mb-6">
        <div className={cn(`${combinedAuthorsPhotos.length > 1 && 'flex -space-x-2'}`, 'me-4')}>
          {combinedAuthorsPhotos.map((authorPhoto, index) => (
            <MediaAvatar
              resource={authorPhoto}
              className="xl:size-[60px] shadow-md"
              key={index}
              fallback={combinedAuthorsInitials[index]}
              isCircle
            />
          ))}
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-brand-600">
            {combinedAuthorsNames.length > 1
              ? combinedAuthorsNames.join(', ')
              : combinedAuthorsNames[0]}
          </p>

          {date && (
            <p className="text-xs text-brand-400">{format(parseISO(date), 'MMMM d, yyyy')}</p>
          )}
        </div>
      </div>
    </>
  )
}
