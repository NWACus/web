'use client'

import { cn } from '@/utilities/ui'

import type { Event } from '@/payload-types'

import { ChevronDown, ExternalLink, MapPin } from 'lucide-react'
import { useState } from 'react'
import { CopyButton } from '../CopyButton'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

type LocationPopoverProps = {
  location: NonNullable<Event['location']>
}

export const LocationPopover = ({ location }: LocationPopoverProps) => {
  const [isLocationOpen, setIsLocationOpen] = useState(false)

  return (
    <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
      <PopoverTrigger className="min-w-0 max-w-full">
        <div className="flex items-center gap-1.5 min-w-0 text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 " />
          <p className="whitespace-nowrap overflow-hidden text-ellipsis min-w-0 text-sm ">
            {location.placeName}
          </p>
          <ChevronDown
            className={cn(
              'h-4 w-4 flex-shrink-0 transition-transform duration-200',
              isLocationOpen && 'rotate-180',
            )}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-3 text-sm w-auto min-w-[200px]">
        <div className="select-text mb-2">
          {location.address && <div>{location.address}</div>}
          <div>
            {location.city && `${location.city}, `}
            {location.state && `${location.state} `}
            {location.zip}
          </div>
        </div>
        <div className="flex gap-2">
          <CopyButton
            text={[
              location.address,
              [location.city, location.state, location.zip].filter(Boolean).join(' '),
            ]
              .filter(Boolean)
              .join(', ')}
            className="flex items-center gap-1 text-xs hover:text-foreground transition-colors"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [location.address, location.city, location.state, location.zip]
                .filter(Boolean)
                .join(', '),
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Maps
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )
}
