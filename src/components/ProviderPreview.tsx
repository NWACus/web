'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'

import type { Provider } from '@/payload-types'

import { courseTypesData } from '@/collections/Courses/constants'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'

export const ProviderPreview = (props: { className?: string; doc?: Provider }) => {
  const { className, doc } = props

  if (!doc) return null

  const { name, location, website, email, phone, courseTypes } = doc

  // Build location display text
  const getLocationText = () => {
    if (!location) return null
    if (location.city && location.state) return `${location.city}, ${location.state}`
    if (location.city) return location.city
    if (location.state) return location.state
    return null
  }

  const locationText = getLocationText()

  // Get course type labels
  const courseTypeLabels = courseTypes
    ?.map((ct) => courseTypesData.find((ctd) => ctd.value === ct)?.label)
    .filter(Boolean)

  return (
    <article className={cn('flex flex-col gap-2 py-3', className)}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium leading-tight">{name}</h3>

        {locationText && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{locationText}</span>
          </div>
        )}

        {/* Contact Information */}
        <div className="flex flex-col gap-1 mt-1">
          {website && (
            <Link
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Website</span>
            </Link>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{email}</span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{phone}</span>
            </a>
          )}
        </div>

        {/* Course Types */}
        {courseTypeLabels && courseTypeLabels.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">Offers: {courseTypeLabels.join(', ')}</p>
          </div>
        )}
      </div>
    </article>
  )
}
