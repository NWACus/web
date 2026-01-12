'use client'

import Link from 'next/link'

import type { Provider } from '@/payload-types'

import { courseTypesData } from '@/constants/courseTypes'
import { getStateLabel } from '@/fields/location/states'
import { cn } from '@/utilities/ui'
import { isValidFullUrl } from '@/utilities/validateUrl'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

export const ProviderPreview = (props: { doc?: Provider }) => {
  const { doc } = props

  if (!doc) return null

  const { name, details, location, website, email, phone, courseTypes } = doc

  const getLocationText = () => {
    if (!location) return null
    if (location.state === 'INTL') return getStateLabel(location.state)
    if (location.city && location.state) return `${location.city}, ${location.state}`
    if (location.city) return location.city
    if (location.state) return location.state
    return 'Location'
  }

  const locationText = getLocationText()

  const courseTypeLabels = courseTypes
    ?.map((ct) => courseTypesData.find((ctd) => ctd.value === ct)?.label)
    .filter(Boolean)

  const validWebsite = website && isValidFullUrl(website) ? website : null

  const contactItems = [locationText, validWebsite, email, phone].filter(Boolean)

  return (
    <Dialog>
      <DialogTrigger className="cursor-help hover:underline text-base w-fit">{name}</DialogTrigger>
      <DialogContent className="flex flex-col gap-2" overlayClassName="bg-transparent">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        {courseTypeLabels && courseTypeLabels.length > 0 && (
          <p>
            <span className="font-semibold">Offers:</span> {courseTypeLabels.join(', ')}
          </p>
        )}
        {details && <p className="hidden md:block text-sm leading-tight">{details}</p>}
        <div className={cn('space-y-1', contactItems.length > 1 && 'md:columns-2')}>
          {locationText && (
            <div className="flex gap-1 text-sm">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{locationText}</span>
            </div>
          )}
          {validWebsite && (
            <Link
              href={validWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>Website</span>
            </Link>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex gap-1 text-sm">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{email}</span>
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="flex gap-1 text-sm">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{phone}</span>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
