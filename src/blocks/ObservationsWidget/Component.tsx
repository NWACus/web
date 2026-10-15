'use client'

import { ObservationLinkHijacker } from '@/app/(frontend)/[center]/observations/ObservationLinkHijacker.client'
import { ButtonLink } from '@/components/ButtonLink'
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import ObservationsDisclaimer from '@/components/ObservationsDisclaimer'
import type { ObservationsWidgetBlock as ObservationsWidgetBlockProps } from '@/payload-types'
import { useAvalancheCenter } from '@/providers/AvalancheCenterProvider'
import { useTenant } from '@/providers/TenantProvider'
import { cn } from '@/utilities/ui'
import * as Sentry from '@sentry/nextjs'
import { DEFAULT_OBSERVATIONS_HEADING } from './config'
import { observationsBlockMapZoom } from './mapZoom'
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

// The center to show observations for, or null when it has none to show
function useObservationsCenter(): string | null {
  const { tenant } = useTenant()
  const { platforms } = useAvalancheCenter()

  const center = typeof tenant === 'object' && tenant !== null ? tenant.slug : null

  if (!center) {
    Sentry.captureException('ObservationsWidgetBlock: center not defined')
    return null
  }

  // Without the observations platform, /observations and the widget's links into it 404
  return platforms?.obs ? center : null
}

export const ObservationsWidgetBlockComponent = ({
  showHeader,
  heading,
  isLayoutBlock = true,
  ...filters
}: Props) => {
  const center = useObservationsCenter()
  const { metadata } = useAvalancheCenter()

  if (!center) return null

  return (
    <div className={cn('flex flex-col gap-4', { 'py-4': isLayoutBlock, breakout: !isLayoutBlock })}>
      <WidgetRouterHandler
        initialPath={observationsWidgetPath(filters, new Date())}
        widgetPageKey="recent-observations"
      />
      <ObservationLinkHijacker />
      <div className={cn('flex flex-col gap-4', { container: isLayoutBlock })}>
        {showHeader !== false && <Header heading={heading} />}
        <ObservationsDisclaimer />
        {/* not-prose keeps rich text typography off the widget's markup. The widget sizes itself
            to the viewport for /observations; on a page it gets a fixed height instead. */}
        <div className="not-prose [&_#nac-obs-app-main]:!h-[min(800px,80vh)] [&_#nac-observation-mobile-view]:!h-[min(800px,80vh)]">
          <NACWidget
            center={center}
            widget="observations"
            observationsMapZoom={observationsBlockMapZoom(metadata?.widget_config)}
          />
        </div>
      </div>
    </div>
  )
}
