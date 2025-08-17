import { Event } from '@/payload-types'
import { cn } from '@/utilities/ui'
import Link from 'next/link'

export interface EventCardProps {
  event: Event
  variant?: 'horizontal' | 'vertical' | 'compact'
  showGroup?: boolean
  showType?: boolean
  showDate?: boolean
  className?: string
}

export const EventCard = ({
  event,
  variant = 'vertical',
  showGroup = true,
  showType = true,
  showDate = true,
  className,
}: EventCardProps) => {
  const tenant = typeof event.tenant === 'object' ? event.tenant : null
  const eventGroups = Array.isArray(event.eventGroups) ? event.eventGroups : []
  const eventType = typeof event.eventType === 'object' ? event.eventType : null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getSkillRatingLabel = (rating: string | null) => {
    switch (rating) {
      case '0':
        return 'Beginner Friendly'
      case '1':
        return 'Previous Knowledge Helpful'
      case '2':
        return 'Prerequisites Required'
      case '3':
        return 'Professional Level'
      default:
        return null
    }
  }

  const formatLocation = () => {
    if (event.location?.isOnline) {
      return 'Virtual Event'
    }

    const parts = []
    if (event.location?.venue) parts.push(event.location.venue)
    if (event.location?.city && event.location?.state) {
      parts.push(`${event.location.city}, ${event.location.state}`)
    } else if (event.location?.city) {
      parts.push(event.location.city)
    } else if (event.location?.state) {
      parts.push(event.location.state)
    }

    return parts.join(' - ') || null
  }

  const eventUrl = event.externalEventUrl || `/${tenant?.slug}/events/${event.slug}`
  const isExternal = !!event.externalEventUrl

  const cardClasses = cn(
    'border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200',
    {
      'flex gap-6': variant === 'horizontal',
      'flex flex-col': variant === 'vertical',
      'p-4': variant === 'compact',
      'p-6': variant !== 'compact',
    },
    className,
  )

  const imageClasses = cn({
    'w-48 h-32 object-cover rounded flex-shrink-0': variant === 'horizontal',
    'w-full h-48 object-cover rounded': variant === 'vertical',
    'w-full h-32 object-cover rounded': variant === 'compact',
  })

  return (
    <div className={cardClasses}>
      {event.featuredImage &&
        typeof event.featuredImage === 'object' &&
        event.featuredImage.url && (
          <div className={variant === 'horizontal' ? 'flex-shrink-0' : 'mb-4'}>
            <img
              src={event.featuredImage.url}
              alt={event.featuredImage.alt || ''}
              className={imageClasses}
            />
          </div>
        )}

      <div className="flex flex-col justify-between flex-1 space-y-3">
        <div className="space-y-2">
          {/* Event Type, Groups, and Skill Rating */}
          {(showType || showGroup || event.skillRating) && (
            <div className="flex flex-wrap gap-2">
              {showType && eventType && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {eventType.title}
                </span>
              )}
              {event.skillRating && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  {getSkillRatingLabel(event.skillRating)}
                </span>
              )}
              {showGroup &&
                eventGroups.slice(0, 2).map((group) => {
                  const groupData = typeof group === 'object' ? group : null
                  if (!groupData) return null
                  return (
                    <span
                      key={groupData.id}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                    >
                      {groupData.title}
                    </span>
                  )
                })}
              {showGroup && eventGroups.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                  +{eventGroups.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Title and Subtitle */}
          <div>
            <h3
              className={variant === 'compact' ? 'text-lg font-semibold' : 'text-xl font-semibold'}
            >
              {event.title}
            </h3>
            {event.subtitle && (
              <p className="text-gray-700 text-sm font-medium mt-1">{event.subtitle}</p>
            )}
          </div>

          {/* Excerpt */}
          {event.excerpt && <p className="text-gray-600 text-sm line-clamp-2">{event.excerpt}</p>}

          {/* Date and Location */}
          {showDate && event.startDate && (
            <div className="text-sm text-gray-500 space-y-1">
              <div className="flex items-center gap-1">
                <time dateTime={event.startDate}>
                  {formatDate(event.startDate)}
                  {event.startDate && ` at ${formatTime(event.startDate)}`}
                </time>
              </div>
              {formatLocation() && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{formatLocation()}</span>
                  {event.location?.extraInfo && (
                    <span className="text-xs text-gray-400">({event.location.extraInfo})</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cost */}
          {typeof event.cost === 'number' && (
            <div className="text-sm font-medium">
              {event.cost === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                <span className="text-gray-900">${event.cost}</span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {event.registrationUrl && (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Register
            </a>
          )}

          <Link
            href={eventUrl}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            More Info
          </Link>
        </div>
      </div>
    </div>
  )
}
