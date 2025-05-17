interface Window {
  mapWidgetData?: {
    googleMapsApiKey: string
    centerId: string
    devMode: boolean
    mountId: string
    baseUrl: string
  }
  forecastWidgetData?: (typeof Window)['mapWidgetData']
  warningWidgetData?: (typeof Window)['mapWidgetData']
  stationWidgetData?: (typeof Window)['mapWidgetData']
  obsWidgetData?: (typeof Window)['mapWidgetData']
}
