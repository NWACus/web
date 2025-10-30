import { cn } from '@/utilities/ui'
import Link from 'next/link'

import type { Event } from '@/payload-types'

import { Calendar, MapPin } from 'lucide-react'
import { ImageMedia } from './Media/ImageMedia'
import { Badge } from './ui/badge'

export const EventPreviewSmallRow = (props: { className?: string; doc?: Event }) => {
  const { className, doc } = props

  if (!doc) return null

  const { featuredImage, startDate, slug, title, location, externalEventUrl, type, subType } = doc

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
    return date.toLocaleDateString('en-US', options)
  }

  const eventDate = startDate ? formatDate(startDate) : null
  const isPastEvent = startDate && new Date(startDate) < new Date()
  const eventUrl = externalEventUrl || `/events/${slug}`
  const isExternal = !!externalEventUrl

  const eventTypeName = type ? type : null
  const eventSubTypeName = subType ? subType : null

  const typeDisplayText =
    eventTypeName && eventSubTypeName
      ? `${eventTypeName} > ${eventSubTypeName}`
      : eventSubTypeName || eventTypeName

  // Build location display text with fallbacks
  const getLocationText = () => {
    if (!location) return null
    if (location.isVirtual) return 'Virtual'
    if (location.placeName) return location.placeName
    if (location.city && location.state) return `${location.city}, ${location.state}`
    if (location.city) return location.city
    if (location.state) return location.state
    return null
  }

  const locationText = getLocationText()

  return (
    <Link
      href={eventUrl}
      className={cn('group', className)}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      <article className={cn('flex gap-3', className)}>
        <div className="flex-shrink-0 overflow-hidden">
          {featuredImage && typeof featuredImage !== 'number' ? (
            <ImageMedia
              imgClassName="w-28 max-h-28 object-cover transition-all duration-200"
              resource={featuredImage}
              pictureClassName="w-28 max-h-28 overflow-hidden rounded aspect-square"
            />
          ) : (
            <div className="w-28 h-20 bg-muted text-muted-foreground flex justify-center items-center rounded">
              <Calendar className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          {typeDisplayText && (
            <div className="text-xs text-muted-foreground">{typeDisplayText}</div>
          )}
          <h3 className="text-lg leading-tight group-hover:underline">{title}</h3>
          <div className="flex flex-col">
            {eventDate && <p className="text-sm text-muted-foreground">{eventDate}</p>}
            {locationText && (
              <div className="flex items-center gap-0.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{locationText}</span>
              </div>
            )}
          </div>
          <div>
            {isPastEvent && (
              <Badge variant="outline" className="text-xs">
                Past Event
              </Badge>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
