'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

export type Widget = 'map' | 'forecast' | 'warnings' | 'stations' | 'observations'

export const loadersByWidget: Record<
  Widget,
  {
    scriptName: string
    widgetDataKey:
      | 'mapWidgetData'
      | 'forecastWidgetData'
      | 'warningWidgetData'
      | 'stationWidgetData'
      | 'obsWidgetData'
    widgetControllerKey:
      | 'mapWidget'
      | 'forecastWidget'
      | 'warningsWidget'
      | 'stationWidget'
      | 'obsWidget'
  }
> = {
  map: {
    scriptName: 'danger-map',
    widgetDataKey: 'mapWidgetData',
    widgetControllerKey: 'mapWidget',
  },
  forecast: {
    scriptName: 'forecasts',
    widgetDataKey: 'forecastWidgetData',
    widgetControllerKey: 'forecastWidget',
  },
  warnings: {
    scriptName: 'warnings',
    widgetDataKey: 'warningWidgetData',
    widgetControllerKey: 'warningsWidget',
  },
  stations: {
    scriptName: 'stations',
    widgetDataKey: 'stationWidgetData',
    widgetControllerKey: 'stationWidget',
  },
  observations: {
    scriptName: 'observations',
    widgetDataKey: 'obsWidgetData',
    widgetControllerKey: 'obsWidget',
  },
}

const loadCSS = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const existingLink = document.querySelector(`link[href="${url}"]`)
    if (existingLink) {
      resolve(url)
      return
    }

    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.onload = () => resolve(url)
    link.onerror = () => reject(url)
    link.href = url

    // Insert before the first stylesheet so other styles take precedence
    const firstStyle = document.head.querySelector('link[rel="stylesheet"], style')
    if (firstStyle) {
      document.head.insertBefore(link, firstStyle)
    } else {
      document.head.prepend(link)
    }
  })
}

export function NACWidget({
  center,
  widget,
  widgetsVersion,
  widgetsBaseUrl,
}: {
  center: string
  widget: Widget
  widgetsVersion: string
  widgetsBaseUrl: string
}) {
  const widgetId = `nac-widget-${widget}`

  // Removes any trailing slashes
  const safeBaseUrl = widgetsBaseUrl.replace(/\/+$/, '')

  const scriptUrl = `${safeBaseUrl}/${widgetsVersion}`

  const { scriptName, widgetDataKey, widgetControllerKey } = loadersByWidget[widget]

  useEffect(
    function loadWidgetCss() {
      loadCSS(`${scriptUrl}/${scriptName}.css`).catch((err) =>
        console.error(`Failed to load style for ${widget} widget:`, err),
      )
    },
    [scriptName, scriptUrl, widget],
  )

  useEffect(function initializeWidgetData() {
    // Base URL (used for Google Analytics)
    const baseUrl = window.location.pathname
    const fallbackCenter = center === 'dvac' ? 'nwac' : center
    const widgetData = {
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      centerId: fallbackCenter.toUpperCase(),
      devMode: true,
      mountId: `#${widgetId}`,
      baseUrl: baseUrl,
      controlledMount: true,
    }

    window[widgetDataKey] = widgetData
  })

  const [widgetScriptReady, setWidgetScriptReady] = useState(false)

  useEffect(
    function handleWidgetMounting() {
      if (
        widgetScriptReady &&
        window[widgetControllerKey] &&
        !window[widgetControllerKey]._mounted
      ) {
        window[widgetControllerKey].mount()
      }

      return () => {
        if (window[widgetControllerKey] && window[widgetControllerKey]._mounted) {
          window[widgetControllerKey].unmount()
        }
      }
    },
    [widgetControllerKey, widgetScriptReady],
  )

  return (
    <>
      {/* container used for css selectors in src/app/(frontend)/[center]/nac-widgets.css */}
      <div id="widget-container" data-widget={widget}>
        <div id={`nac-widget-${widget}`} />
      </div>
      <Script
        src={`${scriptUrl}/${scriptName}.js`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
        type="module"
        onReady={() => {
          setWidgetScriptReady(true)
        }}
      />
    </>
  )
}
