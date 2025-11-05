'use client'

import { getStateLabel } from '@/blocks/Form/State/options'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Provider } from '@/payload-types'
import { useState } from 'react'

const courseTypeLabels: Record<string, string> = {
  'rec-1': 'Rec 1',
  'rec-2': 'Rec 2',
  'pro-1': 'Pro 1',
  'pro-2': 'Pro 2',
  rescue: 'Rescue',
  'awareness-external': 'Awareness',
}

interface ProviderCardProps {
  provider: Provider
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasDescription = provider.details && provider.details.trim().length > 0
  const shouldTruncate = hasDescription && provider.details && provider.details.length > 200

  const displayDescription =
    shouldTruncate && !isExpanded && provider.details
      ? provider.details.slice(0, 200) + '...'
      : provider.details

  return (
    <Card className="@container">
      <CardContent className="p-6">
        <div className="flex flex-col @lg:flex-row gap-4">
          <div className="flex-1 space-y-3">
            {/* Provider Name */}
            <h3 className="text-lg font-semibold">{provider.name}</h3>

            {/* Location */}
            {provider.location && (provider.location.city || provider.location.state) && (
              <div className="text-sm text-muted-foreground">
                {provider.location.city && provider.location.state
                  ? `${provider.location.city}, ${getStateLabel(provider.location.state)}`
                  : provider.location.city ||
                    (provider.location.state && getStateLabel(provider.location.state))}
              </div>
            )}

            {/* Course Types */}
            {provider.courseTypes && provider.courseTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {provider.courseTypes.map((courseType) => (
                  <Badge key={courseType} variant="outline">
                    {courseTypeLabels[courseType] || courseType}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {hasDescription && (
              <div className="text-sm text-muted-foreground">
                <p className="whitespace-pre-wrap">{displayDescription}</p>
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary hover:underline mt-1 font-medium"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
