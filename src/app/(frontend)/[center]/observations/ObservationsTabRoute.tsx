/**
 * The viewer's tabs, `/observations`, `/observations/avalanches` and `/observations/charts`: the
 * native viewer when the center's observations flag is on, the widget (opened on the same view)
 * when it is off. The
 * AFP's `platforms.obs` gates both, as it does the widget. Each page renders its own breadcrumbs.
 */
import { ButtonLink } from '@/components/ButtonLink'
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import ObservationsDisclaimer from '@/components/ObservationsDisclaimer'
import { NativeObservationsPage } from '@/components/observations/NativeObservationsPage'
import type { ViewerTab } from '@/services/nac/observations/routes'
import { assertCenterPlatform } from '@/utilities/centerRoutePage'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

import { ObservationLinkHijacker } from './ObservationLinkHijacker.client'

/** Where each tab opens the widget. */
const WIDGET_PATHS: Record<ViewerTab, string> = {
  observation: '/view/observations',
  avalanche: '/view/avalanches',
  charts: '/view/visual',
}

function WidgetTab({ center, tab }: { center: string; tab: ViewerTab }) {
  return (
    <>
      <WidgetRouterHandler initialPath={WIDGET_PATHS[tab]} widgetPageKey="recent-observations" />
      <ObservationLinkHijacker />
      <div className="flex flex-col gap-4">
        <div className="container flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4 prose dark:prose-invert max-w-none">
            <h1 className="font-bold">Observations</h1>
            <ButtonLink href="/observations/submit" variant="secondary">
              Submit Observation
            </ButtonLink>
          </div>
          <ObservationsDisclaimer />
        </div>
        <NACWidget center={center} widget={'observations'} />
      </div>
    </>
  )
}

export async function ObservationsTabRoute({ center, tab }: { center: string; tab: ViewerTab }) {
  await assertCenterPlatform(center, 'obs')
  if (!(await getNativeProductFlag(center, 'observations'))) {
    return <WidgetTab center={center} tab={tab} />
  }
  return <NativeObservationsPage center={center} tab={tab} />
}
