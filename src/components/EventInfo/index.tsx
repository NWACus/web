'use client'
import { StartAndEndDateDisplay } from '@/components/StartAndEndDateDisplay'
import { skillLevelOptions } from '@/fields/skillLevel'
import type { Event } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { Calendar, Globe, MapPin, TrendingUp, Video } from 'lucide-react'
import { Badge } from '../ui/badge'

export type EventInfoProps = Pick<
  Event,
  'startDate' | 'startDate_tz' | 'endDate' | 'endDate_tz' | 'location' | 'skillLevel'
> & {
  className?: string
  itemsClassName?: string
  showLabels?: boolean
}

export const EventInfo = ({
  className = '',
  endDate,
  endDate_tz,
  itemsClassName = '',
  location,
  showLabels = false,
  skillLevel,
  startDate,
  startDate_tz,
}: EventInfoProps) => {
  const skillLevelLabel = skillLevelOptions.find(({ value }) => skillLevel === value)?.label ?? ''

  return (
    <div className={cn('gap-4 text-sm text-muted-foreground', className)}>
      {/* Date and Time */}
      {startDate && (
        <div className={`flex items-start gap-2 ${itemsClassName}`}>
          <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {showLabels && <span className="font-semibold">Date: </span>}
            <StartAndEndDateDisplay
              startDate={startDate}
              startDate_tz={startDate_tz}
              endDate={endDate}
              endDate_tz={endDate_tz}
            />
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

      {/* Skill Level */}
      {skillLevel && (
        <div className={cn('flex items-center gap-2', itemsClassName)}>
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
          <span>
            {showLabels && <span className="font-semibold">Level: </span>}
            {skillLevelLabel}
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
