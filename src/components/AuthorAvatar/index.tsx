'use client'
import { Media, Post } from '@/payload-types'
import { useEffect, useState } from 'react'

import { formatAuthors } from '@/utilities/formatAuthors'
import { getAuthorInitials } from '@/utilities/getAuthorInitials'
import { getDocumentById } from '@/utilities/getDocumentById'
import { cn } from '@/utilities/ui'
import { format, parseISO } from 'date-fns'
import { MediaAvatar } from '../Media/AvatarImageMedia'

export const AuthorAvatar = (props: {
  authors: Post['authors']
  date: Post['updatedAt']
  showAuthors?: boolean | null
  showDate?: boolean | null
}) => {
  const { authors, date, showAuthors, showDate } = props
  const [combinedAuthorsNames, setCombinedAuthorsNames] = useState<string[]>([])
  const [combinedAuthorsInitials, setCombinedAuthorsInitials] = useState<string[]>([])
  const [combinedAuthorsPhotos, setCombinedAuthorsPhotos] = useState<(number | Media)[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAuthors = async () => {
      const names: string[] = []
      const initials: string[] = []
      const photos: (number | Media)[] = []

      if (authors) {
        for (const author of authors) {
          if (author && typeof author !== 'number') {
            names.push(author.name)
            initials.push(getAuthorInitials(author.name ?? ''))

            const authorPhoto =
              typeof author.photo === 'number'
                ? await getDocumentById('media', author.photo)
                : author.photo

            photos.push(authorPhoto)
          }
        }
      }

      setCombinedAuthorsNames(names)
      setCombinedAuthorsInitials(initials)
      setCombinedAuthorsPhotos(photos)
      setIsLoading(false)
    }

    loadAuthors()
  }, [authors])

  if (isLoading) {
    return null // or return a loading skeleton
  }

  return (
    <>
      <div className={cn('flex items-center mb-4', { 'gap-3': showAuthors })}>
        {showAuthors && (
          <div className={cn('flex', { '-space-x-2': combinedAuthorsPhotos.length > 1 })}>
            {combinedAuthorsPhotos.map((authorPhoto, index) => (
              <MediaAvatar
                resource={authorPhoto}
                className="shadow-md"
                key={index}
                fallback={combinedAuthorsInitials[index]}
                isCircle
              />
            ))}
          </div>
        )}
        <div className="flex flex-col">
          {showAuthors && (
            <p className="text-sm text-brand-600">
              {formatAuthors(combinedAuthorsNames.map((name) => ({ name })))}
            </p>
          )}
          {showDate && date && (
            <p className="text-xs text-brand-400">{format(parseISO(date), 'MMMM d, yyyy')}</p>
          )}
        </div>
      </div>
    </>
  )
}
