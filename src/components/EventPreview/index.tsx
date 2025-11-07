import { cn } from '@/utilities/ui'

import type { Event } from '@/payload-types'

import { eventTypesData } from '@/collections/Events/constants'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { EventMetadata } from '../EventMetadata'
import { ImageMedia } from '../Media/ImageMedia'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { LocationPopover } from './LocationPopover'

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
  | 'type'
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
    type,
    location,
  } = doc

  const isPastEvent = startDate && new Date(startDate) < new Date()
  const isRegistrationClosed = registrationDeadline && new Date(registrationDeadline) < new Date()

  const eventUrl = `/events/${slug}`

  const eventTypeName = type ? eventTypesData.find((et) => et.value === type)?.label : null
  const parsedStartDate = new Date(startDate)
  const month = parsedStartDate.toLocaleDateString('en-US', { month: 'short' })
  const day = parsedStartDate.getDate()
  const year = parsedStartDate.getFullYear()

  return (
    <article
      className={cn(
        'flex flex-col @lg:flex-row gap-4 w-full bg-card text-card-foreground border rounded-lg shadow-sm overflow-hidden p-4 @lg:p-6',
        className,
      )}
    >
      {startDate && (
        <div className="hidden @lg:flex flex-col gap-1 -mt-1 items-center text-center flex-shrink-0 p-4">
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{month}</div>
            <div className="text-2xl font-bold leading-none">{day}</div>
          </div>
          <div className="text-sm">{year}</div>
        </div>
      )}

      <div className="flex flex-col justify-between flex-grow min-w-0">
        <div>
          {eventTypeName && (
            <div className="text-xs text-muted-foreground mb-2">{eventTypeName}</div>
          )}

          {title && (
            <div>
              <Link href={eventUrl ?? '#'} className="mb-2">
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
          {eventUrl && (
            <Link href={eventUrl}>
              <Button
                variant="outline"
                size="sm"
                className="group-hover:opacity-90 transition-opacity"
              >
                Learn More
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-col @lg:items-end gap-1 mb-2 @lg:mb-0">
        {location && <LocationPopover location={location} />}
        <Link
          href={eventUrl ?? '#'}
          className="flex flex-grow w-full @lg:w-48 @xl:w-56 @2xl:w-64 @lg:flex-shrink-0 h-40 @lg:h-auto"
        >
          {featuredImage && typeof featuredImage !== 'number' && (
            <ImageMedia
              imgClassName="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              resource={featuredImage}
              pictureClassName="w-full h-full overflow-hidden rounded"
            />
          )}
        </Link>
      </div>
    </article>
  )
}
