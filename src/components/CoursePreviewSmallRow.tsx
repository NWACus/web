'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { useState } from 'react'

import type { Course } from '@/payload-types'

import { courseTypesData } from '@/collections/Courses/constants'
import { formatDateTime } from '@/utilities/formatDateTime'
import { isSameDay } from 'date-fns'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { Badge } from './ui/badge'

export const CoursePreviewSmallRow = (props: { className?: string; doc?: Course }) => {
  const { className, doc } = props
  const [isExpanded, setIsExpanded] = useState(false)

  if (!doc) return null

  const {
    startDate,
    endDate,
    title,
    location,
    courseUrl,
    courseType,
    subtitle,
    description,
    registrationDeadline,
    timezone,
    provider,
  } = doc

  // Format dates using the same logic as EventPreviewSmallRow and EventInfo
  const getDateDisplay = () => {
    if (!startDate) return null

    if (endDate && isSameDay(startDate, endDate)) {
      return formatDateTime(startDate, timezone, 'MMM d, yyyy')
    } else if (endDate) {
      return `${formatDateTime(startDate, timezone, 'MMM d, yyyy')} - ${formatDateTime(endDate, timezone, 'MMM d, yyyy')}`
    } else {
      return formatDateTime(startDate, timezone, 'MMM d, yyyy')
    }
  }

  const dateDisplay = getDateDisplay()

  const formatRegistrationDeadline = (dateString: string) => {
    return formatDateTime(dateString, timezone, 'MMM d, yyyy')
  }

  // Check if course is past based on endDate (or startDate if no endDate)
  const isPastCourse = endDate
    ? new Date(endDate) < new Date()
    : startDate && new Date(startDate) < new Date()

  const courseTypeDisplay = courseType
    ? courseTypesData.find((ct) => ct.value === courseType)?.label
    : null

  // Build location display text with fallbacks
  const getLocationText = () => {
    if (!location) return null
    if (location.placeName) return location.placeName
    if (location.city && location.state) return `${location.city}, ${location.state}`
    if (location.city) return location.city
    if (location.state) return location.state
    return 'Location'
  }

  const locationText = getLocationText()

  // Get provider name
  const providerName = provider && typeof provider !== 'number' ? provider.name : null

  // Determine if we should render as a link or expandable div
  const hasExternalUrl = !!courseUrl
  const isExpandable = !hasExternalUrl && (subtitle || description || registrationDeadline)

  const content = (
    <article className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 flex-1">
          {courseTypeDisplay && (
            <div className="text-xs text-muted-foreground">{courseTypeDisplay}</div>
          )}
          <h3 className={cn('text-lg leading-tight', hasExternalUrl && 'group-hover:underline')}>
            {title}
          </h3>
          {providerName && (
            <p className="text-sm font-medium text-muted-foreground">{providerName}</p>
          )}
          <div className="flex flex-col">
            {dateDisplay && <p className="text-sm text-muted-foreground">{dateDisplay}</p>}
            {locationText && (
              <div className="flex items-center gap-0.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{locationText}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {isPastCourse && (
              <Badge variant="outline" className="text-xs">
                Past Course
              </Badge>
            )}
          </div>
        </div>
        {isExpandable && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        )}
      </div>

      {isExpanded && isExpandable && (
        <div className="mt-2 pt-2 border-t space-y-2 text-sm">
          {subtitle && <p className="font-medium text-muted-foreground">{subtitle}</p>}
          {description && <p className="text-muted-foreground">{description}</p>}
          {registrationDeadline && (
            <p className="text-sm">
              <span className="font-medium">Registration Deadline:</span>{' '}
              {formatRegistrationDeadline(registrationDeadline)}
            </p>
          )}
        </div>
      )}
    </article>
  )

  if (hasExternalUrl) {
    return (
      <Link
        href={courseUrl}
        className={cn('group block', className)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
