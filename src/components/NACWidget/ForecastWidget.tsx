/**
 * The legacy forecast widget opened at one of its hash routes — what every native forecast route
 * renders while a center's rollout flag is off, so the address keeps working either way.
 */
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'

import type { WidgetPageWithRouterKey } from './widgetRouter'

interface ForecastWidgetProps {
  center: string
  /** The widget's own hash route to open on, e.g. `/all/` or `/archive/forecast`. */
  initialPath: string
  widgetPageKey: WidgetPageWithRouterKey
  /** Anything that has to sit beside the widget, such as a link interceptor. */
  children?: React.ReactNode
}

export function ForecastWidget({
  center,
  initialPath,
  widgetPageKey,
  children,
}: ForecastWidgetProps) {
  return (
    <>
      <WidgetRouterHandler initialPath={initialPath} widgetPageKey={widgetPageKey} />
      {children}
      <div className="container flex flex-col">
        <NACWidget center={center} widget="forecast" />
      </div>
    </>
  )
}
