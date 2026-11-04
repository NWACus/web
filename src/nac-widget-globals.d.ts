interface Window {
  mapWidgetData?: {
    googleMapsApiKey: string
    centerId: string
    devMode: boolean
    mountId: string
    baseUrl: string
    controlledMount?: boolean
    /** Danger map only: pixel height of the map container. */
    height?: number
    /** Narrow handle on the host page's PostHog client, so the widget reuses it instead of creating its own. */
    posthog?: import('./utilities/widgetPostHogClient').WidgetPostHogClient
  }
  mediaWidgetData?: Window['mapWidgetData'] & {
    /** Media widget only: layout mode. */
    mode?: 'carousel' | 'grid'
  }
  forecastWidgetData?: Window['mapWidgetData']
  warningWidgetData?: Window['mapWidgetData']
  stationWidgetData?: Window['mapWidgetData']
  obsWidgetData?: Window['mapWidgetData']
  mapWidget?: {
    mount: () => void
    unmount: () => void
    _mounted: boolean
  }
  mediaWidget?: Window['mapWidget']
  forecastWidget?: Window['mapWidget']
  warningsWidget?: Window['mapWidget']
  stationWidget?: Window['mapWidget']
  obsWidget?: Window['mapWidget']
}
