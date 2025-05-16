'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export type Widget = 'map' | 'forecast' | 'warning' | 'stations' | 'observations'

export function NACWidget({ center, widget }: { center: string; widget: Widget }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9))

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous content
    containerRef.current.innerHTML = ''

    // Create a unique ID for this instance of the widget
    const widgetId = `nac-widget-${widget}-${instanceId}`

    // Create the div to mount the app on
    const appDiv = document.createElement('div')
    appDiv.id = widgetId
    containerRef.current.appendChild(appDiv)

    // AWS Bucket/CDN
    const awsBucket = 'https://du6amfiq9m9h7.cloudfront.net'
    const version = '20250313' // Using production version from your code
    const scriptUrl = `${awsBucket}/public/v2/${version}/`

    // Base URL (used for Google Analytics)
    const baseUrl = window.location.pathname

    // Load CSS
    const loadCSS = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link')
        link.type = 'text/css'
        link.rel = 'stylesheet'
        link.onload = () => resolve(url)
        link.onerror = () => reject(url)
        link.href = url
        document.head.appendChild(link)
      })
    }

    // Load JS
    const loadJS = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.async = true
        script.type = 'module'
        script.onload = () => resolve(url)
        script.onerror = () => reject(url)
        script.src = url
        document.body.appendChild(script)
      })
    }

    // Prepare widget data
    const widgetData = {
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      centerId: center.toUpperCase(),
      devMode: false,
      mountId: `#${widgetId}`,
      baseUrl: baseUrl,
    }

    // Add widget-specific data to window
    switch (widget) {
      case 'map':
        ;(window as any).mapWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}danger-map.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}danger-map.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load map widget:', err))
        break

      case 'forecast':
        ;(window as any).forecastWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}forecasts.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}forecasts.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load forecast widget:', err))
        break

      case 'warning':
        ;(window as any).warningWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}warnings.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}warnings.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load warning widget:', err))
        break

      case 'stations':
        const stationData = {
          ...widgetData,
          auth: false, // Set this based on your needs
        }
        ;(window as any).stationWidgetData = stationData
        Promise.all([
          loadJS(`${scriptUrl}stations.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}stations.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load stations widget:', err))
        break

      case 'observations':
        const obsData = {
          ...widgetData,
          auth: false, // Set this based on your needs
        }
        ;(window as any).obsWidgetData = obsData
        Promise.all([
          loadJS(`${scriptUrl}observations.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}observations.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load observations widget:', err))
        break
    }

    // Cleanup function
    return () => {
      // Clean up globals to prevent memory leaks
      switch (widget) {
        case 'map':
          ;(window as any).mapWidgetData = undefined
          break
        case 'forecast':
          ;(window as any).forecastWidgetData = undefined
          break
        case 'warning':
          ;(window as any).warningWidgetData = undefined
          break
        case 'stations':
          ;(window as any).stationWidgetData = undefined
          break
        case 'observations':
          ;(window as any).obsWidgetData = undefined
          break
      }
    }
  }, [center, widget, pathname, instanceId])

  return <div id="widget-container" ref={containerRef}></div>
}
