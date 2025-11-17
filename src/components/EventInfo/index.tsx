'use client'
import { StartAndEndDateDisplay } from '@/fields/startAndEndDateField/components/StartAndEndDateDisplay'
import type { Event } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { Calendar, DollarSign, Globe, MapPin, TrendingUp, Users, Video } from 'lucide-react'
import { Badge } from '../ui/badge'

const skillLevelLabels: Record<string, string> = {
  '0': 'Beginner Friendly',
  '1': 'Previous Knowledge Helpful',
  '2': 'Prerequisites Required',
  '3': 'Professional Level',
}

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
  return (
    <div className={cn('gap-4 text-sm text-muted-foreground', className)}>
      {/* Date and Time */}
      {startDate && (
        <div className={`flex items-start gap-2 ${itemsClassName}`}>
          <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {showLabels && <span className="font-semibold">Date: </span>}
            <StartAndEndDateDisplay startDate={startDate} endDate={endDate} timezone={timezone} />
          </div>
        </div>
      )}

      {/* Location */}
      {location && (
        <div className={cn('flex items-start gap-2', itemsClassName)}>
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
                {showLabels && <span className="font-semibold">Location: </span>}
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
        <div className={cn('flex items-center gap-2', itemsClassName)}>
          <DollarSign className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-semibold">Cost: </span>}
            {cost === 0 ? 'Free' : `$${cost}`}
          </span>
        </div>
      )}

      {/* Capacity */}
      {capacity && (
        <div className={cn('flex items-center gap-2', itemsClassName)}>
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-semibold">Capacity: </span>}
            {capacity} {capacity === 1 ? 'spot' : 'spots'}
          </span>
        </div>
      )}

      {/* Skill Rating */}
      {skillRating && (
        <div className={cn('flex items-center gap-2', itemsClassName)}>
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-semibold">Level: </span>}
            {skillLevelLabels[skillRating] || skillRating}
          </span>
        </div>
      )}

      {location?.extraInfo && (
        <div className={cn('flex items-start gap-2', itemsClassName)}>
          <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {showLabels && <span className="font-semibold">Additional Info: </span>}
            <span>{location.extraInfo}</span>
          </div>
        </div>
      )}
    </div>
  )
}
