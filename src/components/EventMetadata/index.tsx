'use client'
import type { Event } from '@/payload-types'
import type { USTimezone } from '@/utilities/timezones'
import { Calendar, Clock, DollarSign, Globe, MapPin, TrendingUp, Users, Video } from 'lucide-react'
import { Badge } from '../ui/badge'

export type EventMetadataProps = Pick<
  Event,
  'startDate' | 'endDate' | 'timezone' | 'location' | 'cost' | 'capacity' | 'skillRating'
> & {
  className?: string
  showLabels?: boolean
}

export const EventMetadata = ({
  startDate,
  endDate,
  timezone,
  location,
  cost,
  capacity,
  skillRating,
  className = '',
  showLabels = false,
}: EventMetadataProps) => {
  const formatDateTime = (dateString: string, tz?: string | null) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      ...(tz && { timeZone: tz as USTimezone }),
    }
    return date.toLocaleString('en-US', options)
  }

  const skillLevelLabels: Record<string, string> = {
    '0': 'Beginner Friendly',
    '1': 'Previous Knowledge Helpful',
    '2': 'Prerequisites Required',
    '3': 'Professional Level',
  }

  return (
    <div className={`flex flex-col gap-2 text-sm text-muted-foreground ${className}`}>
      {/* Date and Time */}
      {startDate && (
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {showLabels && <span className="font-medium">Date: </span>}
            <span>{formatDateTime(startDate, timezone)}</span>
            {endDate && (
              <>
                <span className="mx-1">-</span>
                <span>{formatDateTime(endDate, timezone)}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      {location && (
        <div className="flex items-start gap-2">
          {location.isVirtual ? (
            <>
              <Video className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <Badge variant="secondary" className="mr-2">
                  Virtual Event
                </Badge>
                {showLabels && location.virtualUrl && (
                  <a
                    href={location.virtualUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Join Online
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                {showLabels && <span className="font-medium">Location: </span>}
                {(location.placeName || location.placeName) && (
                  <div>{location.placeName || location.placeName}</div>
                )}
                {(location.address || location.city || location.state) && (
                  <div>
                    {location.address && <span>{location.address}, </span>}
                    {location.city && <span>{location.city}, </span>}
                    {location.state} {location.zip || location.zip}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {location?.extraInfo && (
        <div className="flex items-start gap-2">
          <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {showLabels && <span className="font-medium">Additional Info: </span>}
            <span>{location.extraInfo}</span>
          </div>
        </div>
      )}

      {/* Cost */}
      {cost !== undefined && cost !== null && (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-medium">Cost: </span>}
            {cost === 0 ? 'Free' : `$${cost}`}
          </span>
        </div>
      )}

      {/* Capacity */}
      {capacity && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-medium">Capacity: </span>}
            {capacity} {capacity === 1 ? 'spot' : 'spots'}
          </span>
        </div>
      )}

      {/* Skill Rating */}
      {skillRating && (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-medium">Level: </span>}
            {skillLevelLabels[skillRating] || skillRating}
          </span>
        </div>
      )}

      {/* Timezone indicator */}
      {timezone && !startDate && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs">{timezone}</span>
        </div>
      )}
    </div>
  )
}
