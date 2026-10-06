'use client'

import { ObservationLinkHijacker } from '@/app/(frontend)/[center]/observations/ObservationLinkHijacker.client'
import { ButtonLink } from '@/components/ButtonLink'
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import ObservationsDisclaimer from '@/components/ObservationsDisclaimer'
import type { ObservationsWidgetBlock as ObservationsWidgetBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { cn } from '@/utilities/ui'
import * as Sentry from '@sentry/nextjs'
import { DEFAULT_OBSERVATIONS_HEADING } from './config'
import { observationsWidgetPath } from './widgetPath'

type Props = ObservationsWidgetBlockProps & {
  isLayoutBlock?: boolean
}

function Header({ heading }: { heading?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4 prose dark:prose-invert max-w-none">
      <h2 className="font-bold">{heading || DEFAULT_OBSERVATIONS_HEADING}</h2>
      <ButtonLink href="/observations/submit" variant="secondary">
        Submit Observation
      </ButtonLink>
    </div>
  )
}

export const ObservationsWidgetBlockComponent = ({
  showHeader,
  heading,
  isLayoutBlock = true,
  ...filters
}: Props) => {
  const { tenant } = useTenant()

  const center = typeof tenant === 'object' && tenant !== null ? tenant.slug : null

  if (!center) {
    Sentry.captureException('ObservationsWidgetBlock: center not defined')
    return null
  }

  return (
    <div className={cn('flex flex-col gap-4', { 'py-4': isLayoutBlock })}>
      <WidgetRouterHandler
        initialPath={observationsWidgetPath(filters, new Date())}
        widgetPageKey="recent-observations"
      />
      <ObservationLinkHijacker />
      <div className={cn('flex flex-col gap-4', { container: isLayoutBlock })}>
        {showHeader !== false && <Header heading={heading} />}
        <ObservationsDisclaimer />
        {/* Keeps rich text typography off the widget's own markup */}
        <div className="not-prose">
          <NACWidget center={center} widget="observations" />
        </div>
      </div>
    </div>
  )
}
