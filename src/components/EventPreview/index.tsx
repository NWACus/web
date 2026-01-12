import { formatDateTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

import type { Event } from '@/payload-types'

import { eventTypesData } from '@/constants/eventTypes'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { EventInfo } from '../EventInfo'
import { CMSLink } from '../Link'
import { ImageMedia } from '../Media/ImageMedia'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { LocationPopover } from './LocationPopover'

export const EventPreview = (props: {
  alignItems?: 'center'
  className?: string
  event?: Event
}) => {
  const { className, event } = props

  if (!event) return null

  const {
    title,
    subtitle,
    description,
    slug,
    thumbnailImage,
    startDate,
    startDate_tz,
    endDate,
    endDate_tz,
    skillLevel,
    registrationDeadline,
    registrationUrl,
    type,
    location,
  } = event

  const isPastEvent = startDate && new Date(startDate) < new Date()
  const isRegistrationClosed = registrationDeadline && new Date(registrationDeadline) < new Date()

  const eventUrl = `/events/${slug}`

  const eventTypeDisplay = type ? eventTypesData.find((et) => et.value === type)?.label : null

  const month = formatDateTime(startDate, startDate_tz, 'MMM')
  const day = formatDateTime(startDate, startDate_tz, 'd')
  const year = formatDateTime(startDate, startDate_tz, 'yyyy')

  return (
    <article
      className={cn(
        'flex flex-col @lg:flex-row gap-4 w-full bg-card text-card-foreground border rounded-lg shadow-sm overflow-hidden p-4 @lg:p-6',
        className,
      )}
    >
      {startDate && (
        <div className="hidden @md:flex flex-col min-w-[80px] gap-1 items-center text-center">
          <div
            className={cn('flex flex-col pt-4', {
              'text-muted-foreground italic': isPastEvent,
            })}
          >
            <div className="text-2xl font-bold">{month}</div>
            <div className="text-2xl font-bold leading-none pb-1">{day}</div>
            <div className="text-sm pb-2">{year}</div>
            {isPastEvent && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap not-italic">
                Past Event
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col justify-between flex-grow min-w-0 gap-4">
        <div className="flex flex-col gap-2">
          {eventTypeDisplay && (
            <div className="text-xs text-muted-foreground">{eventTypeDisplay}</div>
          )}
          {title && (
            <div>
              <Link href={eventUrl ?? '#'}>
                <h3 className="text-lg @lg:text-xl font-semibold leading-tight group-hover:underline">
                  {title}
                </h3>
              </Link>
              {subtitle && <p className="text-muted-foreground line-clamp-1">{subtitle}</p>}
            </div>
          )}
          {description && (
            <p className="text-muted-foreground text-sm @lg:text-base line-clamp-3">
              {description}
            </p>
          )}
          <div className="flex flex-col gap-1">
            <EventInfo
              startDate={startDate}
              startDate_tz={startDate_tz}
              endDate={endDate}
              endDate_tz={endDate_tz}
              skillLevel={skillLevel}
              className="flex flex-col gap-1"
            />
            {location?.isVirtual ? (
              <Badge variant="outline" className="text-xs whitespace-nowrap not-italic my-2 w-fit">
                Virtual Event
              </Badge>
            ) : (
              location && <LocationPopover location={location} />
            )}
          </div>
        </div>

        <div className="flex @sm:flex-col @md:flex-row gap-3">
          {registrationUrl &&
            (isPastEvent || isRegistrationClosed ? (
              <Button
                className="group-hover:opacity-90 transition-opacity"
                size="sm"
                variant="default"
                disabled
              >
                Registration Closed
                <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-muted" />
              </Button>
            ) : (
              <Button asChild size="sm" className="group-hover:opacity-90 transition-opacity">
                <Link href={registrationUrl} target="_blank" rel="noopener noreferrer">
                  Register
                  <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2 -mt-1.5 lg:-mt-0.5 text-muted" />
                </Link>
              </Button>
            ))}
          <CMSLink
            appearance="outline"
            size="sm"
            className="group-hover:opacity-90 transition-opacity"
            url={eventUrl}
          >
            Learn More
          </CMSLink>
        </div>
      </div>
      <div className="flex flex-col @lg:items-end gap-1 mb-2 @lg:mb-0">
        <Link
          href={eventUrl}
          className="flex flex-grow w-full @lg:w-48 @xl:w-56 @2xl:w-64 @lg:flex-shrink-0 h-full"
        >
          {thumbnailImage && typeof thumbnailImage !== 'number' && (
            <ImageMedia
              imgClassName="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              resource={thumbnailImage}
              pictureClassName="w-full h-full overflow-hidden rounded"
            />
          )}
        </Link>
      </div>
    </article>
  )
}
