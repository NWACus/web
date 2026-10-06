'use client'

import { ObservationLinkHijacker } from '@/app/(frontend)/[center]/observations/ObservationLinkHijacker.client'
import { ButtonLink } from '@/components/ButtonLink'
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import ObservationsDisclaimer from '@/components/ObservationsDisclaimer'
import { useTenant } from '@/providers/TenantProvider'
import * as Sentry from '@sentry/nextjs'

export const ObservationsWidgetBlockComponent = () => {
  const { tenant } = useTenant()

  const center = typeof tenant === 'object' && tenant !== null ? tenant.slug : null

  if (!center) {
    Sentry.captureException('ObservationsWidgetBlock: center not defined')
    return null
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <WidgetRouterHandler initialPath="/view/observations" widgetPageKey="recent-observations" />
      <ObservationLinkHijacker />
      <div className="container flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4 prose dark:prose-invert max-w-none">
          <h2 className="font-bold">Recent Observations</h2>
          <ButtonLink href="/observations/submit" variant="secondary">
            Submit Observation
          </ButtonLink>
        </div>
        <ObservationsDisclaimer />
      </div>
      <NACWidget center={center} widget="observations" />
    </div>
  )
}
