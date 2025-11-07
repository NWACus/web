'use client'
import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { isSameDay } from 'date-fns'
import { Calendar, DollarSign, Globe, MapPin, TrendingUp, Users, Video } from 'lucide-react'
import { Badge } from '../ui/badge'

export type EventInfoProps = Pick<
  Event,
  'startDate' | 'endDate' | 'timezone' | 'location' | 'cost' | 'capacity' | 'skillRating'
> & {
  className?: string
  itemsClassName?: string
  showLabels?: boolean
}

export const EventInfo = ({
  capacity,
  className = '',
  cost,
  endDate,
  itemsClassName = '',
  location,
  showLabels = false,
  skillRating,
  startDate,
  timezone,
}: EventInfoProps) => {
  const skillLevelLabels: Record<string, string> = {
    '0': 'Beginner Friendly',
    '1': 'Previous Knowledge Helpful',
    '2': 'Prerequisites Required',
    '3': 'Professional Level',
  }

  return (
    <div className={`gap-4 text-sm text-muted-foreground ${className}`}>
      {/* Date and Time */}
      {startDate && (
        <div className={`flex items-start gap-2 ${itemsClassName}`}>
          <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {showLabels && <span className="font-medium font-semibold">Date: </span>}

            {endDate && isSameDay(startDate, endDate) ? (
              <>
                <span>
                  {formatDateTime(startDate, timezone, 'MMM d, yyyy, p')}-{' '}
                  {formatDateTime(endDate, timezone, 'p zzz')}
                </span>
              </>
            ) : (
              <>
                <span>{formatDateTime(startDate, timezone, 'MMM d, yyyy, p')}</span>
                {endDate && (
                  <>
                    <span className="mx-1">-</span>
                    <span>{formatDateTime(endDate, timezone, 'MMM d, yyyy, p')}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      {location && (
        <div className={`flex items-start gap-2 ${itemsClassName}`}>
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
                {location.placeName && <div>{location.placeName}</div>}
                {(location.address || location.city || location.state || location.zip) && (
                  <div>
                    {[location.address, location.city, location.state, location.zip]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Cost */}
      {cost !== undefined && cost !== null && (
        <div className={`flex items-center gap-2 ${itemsClassName}`}>
          <DollarSign className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-medium font-semibold">Cost: </span>}
            {cost === 0 ? 'Free' : `$${cost}`}
          </span>
        </div>
      )}

      {/* Capacity */}
      {capacity && (
        <div className={`flex items-center gap-2 ${itemsClassName}`}>
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-medium font-semibold">Capacity: </span>}
            {capacity} {capacity === 1 ? 'spot' : 'spots'}
          </span>
        </div>
      )}

      {/* Skill Rating */}
      {skillRating && (
        <div className={`flex items-center gap-2 ${itemsClassName}`}>
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-medium font-semibold">Level: </span>}
            {skillLevelLabels[skillRating] || skillRating}
          </span>
        </div>
      )}

      {location?.extraInfo && (
        <div className={`flex items-start gap-2 ${itemsClassName}`}>
          <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {showLabels && <span className="font-medium font-semibold">Additional Info: </span>}
            <span>{location.extraInfo}</span>
          </div>
        </div>
      )}
    </div>
  )
}
