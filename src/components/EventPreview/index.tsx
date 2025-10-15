import { cn } from '@/utilities/ui'

import type { Event } from '@/payload-types'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
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
  | 'registrationUrl'
  | 'externalEventUrl'
  | 'eventType'
  | 'eventSubType'
>

export const EventPreview = (props: {
  alignItems?: 'center'
  className?: string
  doc?: EventPreviewData
}) => {
  const { className, doc } = props

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
    skillRating,
    registrationDeadline,
    registrationUrl,
    eventType,
    eventSubType,
  } = doc

  const isPastEvent = startDate && new Date(startDate) < new Date()
  const isRegistrationClosed = registrationDeadline && new Date(registrationDeadline) < new Date()

  const eventUrl = `/events/${slug}`

  const eventTypeName = eventType && typeof eventType !== 'number' ? eventType.title : null
  const eventSubTypeName =
    eventSubType && typeof eventSubType !== 'number' ? eventSubType.title : null

  const parsedStartDate = new Date(startDate)
  const month = parsedStartDate.toLocaleDateString('en-US', { month: 'short' })
  const day = parsedStartDate.getDate()
  const year = parsedStartDate.getFullYear()

  return (
    <article
      className={cn(
        'flex flex-col @md:flex-row gap-4 w-full bg-card text-card-foreground border rounded-lg shadow-sm overflow-hidden p-4 @md:p-6',
        className,
      )}
    >
      {startDate && (
        <div className="hidden @md:flex flex-col gap-1 -mt-1 items-center text-center flex-shrink-0">
          <div className="flex flex-col">
            <div className="text-3xl font-bold">{month}</div>
            <div className="text-3xl font-bold leading-none">{day}</div>
          </div>
          <div className="text-sm">{year}</div>
        </div>
      )}

      <div className="flex flex-col justify-between flex-grow min-w-0">
        <div>
          {(eventTypeName || eventSubTypeName) && (
            <div className="text-xs text-muted-foreground mb-2">
              {eventSubTypeName || eventTypeName}
            </div>
          )}

          {title && (
            <div>
              <Link href={eventUrl} className="mb-2">
                <h3 className="text-lg @lg:text-xl font-semibold leading-tight group-hover:underline">
                  {title}
                </h3>
              </Link>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          )}

          {description && (
            <p className="text-muted-foreground text-sm @lg:text-base line-clamp-3 mb-4">
              {description}
            </p>
          )}
          <EventMetadata
            startDate={startDate}
            endDate={endDate}
            timezone={timezone}
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

        <div className="flex gap-3">
          {registrationUrl && (
            <Link href={registrationUrl}>
              <Button
                variant="default"
                size="sm"
                className="group-hover:opacity-90 transition-opacity"
              >
                Register
                <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-muted" />
              </Button>
            </Link>
          )}
          <Link href={eventUrl}>
            <Button
              variant="outline"
              size="sm"
              className="group-hover:opacity-90 transition-opacity"
            >
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      <Link
        href={eventUrl}
        className="w-full @md:w-48 @lg:w-56 @xl:w-64 @md:flex-shrink-0 h-40 @md:h-auto overflow-hidden rounded"
      >
        {featuredImage && typeof featuredImage !== 'number' && (
          <ImageMedia
            imgClassName="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            resource={featuredImage}
            pictureClassName="w-full h-full"
          />
        )}
      </Link>
    </article>
  )
}
