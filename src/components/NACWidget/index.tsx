'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export type Widget = 'map' | 'forecast' | 'warning' | 'stations' | 'observations'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9))
  const scriptRefsRef = useRef<HTMLScriptElement[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ''

    const widgetId = `nac-widget-${widget}-${instanceId}`

    const appDiv = document.createElement('div')
    appDiv.id = widgetId
    containerRef.current.appendChild(appDiv)

    // Removes any trailing slashes
    const safeBaseUrl = widgetsBaseUrl.replace(/\/+$/, '')

    const scriptUrl = `${safeBaseUrl}/${widgetsVersion}`

    // Base URL (used for Google Analytics)
    const baseUrl = window.location.pathname

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

    const loadJS = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${url}"]`)
        if (existingScript) {
          resolve(url)
          return
        }

        const script = document.createElement('script')
        script.async = true
        script.type = 'module'
        script.onload = () => resolve(url)
        script.onerror = () => reject(url)
        script.src = url

        scriptRefsRef.current.push(script)

        document.body.appendChild(script)
      })
    }

    const widgetData = {
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      centerId: center.toUpperCase(),
      devMode: false,
      mountId: `#${widgetId}`,
      baseUrl: baseUrl,
    }

    const loadersByWidget: Record<
      Widget,
      {
        script: string
        dataKey:
          | 'mapWidgetData'
          | 'forecastWidgetData'
          | 'warningWidgetData'
          | 'stationWidgetData'
          | 'obsWidgetData'
      }
    > = {
      map: { script: 'danger-map', dataKey: 'mapWidgetData' },
      forecast: { script: 'forecasts', dataKey: 'forecastWidgetData' },
      warning: { script: 'warnings', dataKey: 'warningWidgetData' },
      stations: { script: 'stations', dataKey: 'stationWidgetData' },
      observations: { script: 'observations', dataKey: 'obsWidgetData' },
    }

    const { script, dataKey } = loadersByWidget[widget]
    window[dataKey] = widgetData

    Promise.all([
      loadJS(`${scriptUrl}/${script}.js?t=${Date.now()}`),
      loadCSS(`${scriptUrl}/${script}.css`),
    ]).catch((err) => console.error('Failed to load ${widget} widget:', err))

    return () => {
      // Clean up globals
      switch (widget) {
        case 'map':
          window.mapWidgetData = undefined
          break
        case 'forecast':
          window.forecastWidgetData = undefined
          break
        case 'warning':
          window.warningWidgetData = undefined
          break
        case 'stations':
          window.stationWidgetData = undefined
          break
        case 'observations':
          window.obsWidgetData = undefined
          break
      }

      // Remove script tags
      scriptRefsRef.current.forEach((script) => {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })
      scriptRefsRef.current = []
    }
  }, [center, widget, pathname, instanceId])

  return <div id="widget-container" ref={containerRef} data-widget={widget}></div>
}
