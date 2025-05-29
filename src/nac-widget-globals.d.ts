interface Window {
  mapWidgetData?: {
    googleMapsApiKey: string
    centerId: string
    devMode: boolean
    mountId: string
    baseUrl: string
    controlledMount?: boolean
  }
  forecastWidgetData?: (typeof Window)['mapWidgetData']
  warningWidgetData?: (typeof Window)['mapWidgetData']
  stationWidgetData?: (typeof Window)['mapWidgetData']
  obsWidgetData?: (typeof Window)['mapWidgetData']
  mapWidget?: {
    mount: () => void
    unmount: () => void
    _mounted: boolean
  }
  forecastWidget?: (typeof Window)['mapWidget']
  warningWidget?: (typeof Window)['mapWidget']
  stationWidget?: (typeof Window)['mapWidget']
  obsWidget?: (typeof Window)['mapWidget']
}
