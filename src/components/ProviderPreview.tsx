'use client'

import Link from 'next/link'

import type { Provider } from '@/payload-types'

import { courseTypesData } from '@/collections/Courses/constants'
import { isValidFullUrl } from '@/utilities/validateUrl'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export const ProviderPreview = (props: { doc?: Provider }) => {
  const { doc } = props

  if (!doc) return null

  const { name, location, website, email, phone, courseTypes } = doc

  const getLocationText = () => {
    if (!location) return null
    if (location.city && location.state) return `${location.city}, ${location.state}`
    if (location.city) return location.city
    if (location.state) return location.state
    return null
  }

  const locationText = getLocationText()

  const courseTypeLabels = courseTypes
    ?.map((ct) => courseTypesData.find((ctd) => ctd.value === ct)?.label)
    .filter(Boolean)

  const validWebsite = website && isValidFullUrl(website) ? website : null

  return (
    <Popover>
      <PopoverTrigger className="cursor-help hover:underline text-base w-fit">
        {name}
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-1 py-2" align="start" sideOffset={8}>
        {courseTypeLabels && courseTypeLabels.length > 0 && (
          <p>Offers: {courseTypeLabels.join(', ')}</p>
        )}
        {locationText && (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{locationText}</span>
          </div>
        )}
        {validWebsite && (
          <Link
            href={validWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Website</span>
          </Link>
        )}
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-1 text-sm">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{email}</span>
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className="flex items-center gap-1 text-sm">
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{phone}</span>
          </a>
        )}
      </PopoverContent>
    </Popover>
  )
}
