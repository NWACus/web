interface Window {
  mapWidgetData?: {
    googleMapsApiKey: string
    centerId: string
    devMode: boolean
    mountId: string
    baseUrl: string
    controlledMount?: boolean
  }
  mediaWidgetData?: (typeof Window)['mediaWidgetData']
  forecastWidgetData?: (typeof Window)['mapWidgetData']
  warningWidgetData?: (typeof Window)['mapWidgetData']
  stationWidgetData?: (typeof Window)['mapWidgetData']
  obsWidgetData?: (typeof Window)['mapWidgetData']
  mapWidget?: {
    mount: () => void
    unmount: () => void
    _mounted: boolean
  }
  mediaWidget?: (typeof Window)['mediaWidget']
  forecastWidget?: (typeof Window)['mapWidget']
  warningsWidget?: (typeof Window)['mapWidget']
  stationWidget?: (typeof Window)['mapWidget']
  obsWidget?: (typeof Window)['mapWidget']
}
