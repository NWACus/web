'use client'
import { cn } from '@/utilities/ui'
import Link from 'next/link'

import type { Event } from '@/payload-types'

import { EventMetadata } from '../EventMetadata'
import { ImageMedia } from '../Media/ImageMedia'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export type EventPreviewData = Pick<
  Event,
  | 'title'
  | 'subtitle'
  | 'description'
  | 'slug'
  | 'featuredImage'
  | 'startDate'
  | 'endDate'
  | 'timezone'
  | 'location'
  | 'cost'
  | 'capacity'
  | 'skillRating'
  | 'registrationDeadline'
  | 'externalEventUrl'
>

export const EventPreview = (props: {
  alignItems?: 'center'
  className?: string
  doc?: EventPreviewData
  title?: string
}) => {
  const { className, doc, title: titleFromProps } = props

  if (!doc) return null

  const {
    title,
    subtitle,
    description,
    slug,
    featuredImage,
    startDate,
    endDate,
    timezone,
    location,
    cost,
    capacity,
    skillRating,
    registrationDeadline,
    externalEventUrl,
  } = doc

  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')

  const isPastEvent = startDate && new Date(startDate) < new Date()
  const isRegistrationClosed = registrationDeadline && new Date(registrationDeadline) < new Date()

  const eventUrl = externalEventUrl || `/events/${slug}`
  const isExternal = !!externalEventUrl

  return (
    <Link
      href={eventUrl}
      className={cn('group no-underline flex flex-grow', className)}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      <article
        className={cn(
          'flex flex-col @md:flex-row w-full bg-card text-card-foreground border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden',
          className,
        )}
      >
        <div className="w-full @md:w-56 @xl:w-72 @2xl:w-80 @md:flex-shrink-0 h-48 @md:h-auto overflow-hidden flex items-center">
          {featuredImage && typeof featuredImage !== 'number' && (
            <ImageMedia
              imgClassName="w-full object-cover transition-transform duration-300"
              resource={featuredImage}
              pictureClassName="w-full"
            />
          )}
        </div>
        <div className="flex flex-col justify-between px-6 py-4 flex-grow border-t @md:border-t-0 @md:border-l">
          <div>
            {titleToUse && (
              <div className="mb-3">
                <h3 className="text-lg @lg:text-xl font-semibold leading-tight group-hover:underline">
                  {titleToUse}
                </h3>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
            )}
            {description && (
              <p className="text-muted-foreground text-sm @lg:text-base line-clamp-2 mb-4">
                {sanitizedDescription}
              </p>
            )}
            <EventMetadata
              startDate={startDate}
              endDate={endDate}
              timezone={timezone}
              location={location}
              cost={cost}
              capacity={capacity}
              skillRating={skillRating}
              className="mb-4"
            />
            {(isPastEvent || isRegistrationClosed) && (
              <div className="flex gap-2 mb-2">
                {isPastEvent && (
                  <Badge variant="secondary" className="text-xs">
                    Past Event
                  </Badge>
                )}
                {isRegistrationClosed && !isPastEvent && (
                  <Badge variant="destructive" className="text-xs">
                    Registration Closed
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200"
          >
            {isExternal ? 'Visit Event Page' : isPastEvent ? 'View Details' : 'Learn More'}
          </Button>
        </div>
      </article>
    </Link>
  )
}
