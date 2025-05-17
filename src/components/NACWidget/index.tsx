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
    const now = Date.now()

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

    switch (widget) {
      case 'map':
        window.mapWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}/danger-map.js?t=${now}`),
          loadCSS(`${scriptUrl}/danger-map.css`),
        ]).catch((err) => console.error('Failed to load map widget:', err))
        break

      case 'forecast':
        window.forecastWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}/forecasts.js?t=${now}`),
          loadCSS(`${scriptUrl}/forecasts.css`),
        ]).catch((err) => console.error('Failed to load forecast widget:', err))
        break

      case 'warning':
        window.warningWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}/warnings.js?t=${now}`),
          loadCSS(`${scriptUrl}/warnings.css`),
        ]).catch((err) => console.error('Failed to load warning widget:', err))
        break

      case 'stations':
        window.stationWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}/stations.js?t=${now}`),
          loadCSS(`${scriptUrl}/stations.css`),
        ]).catch((err) => console.error('Failed to load stations widget:', err))
        break

      case 'observations':
        window.obsWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}/observations.js?t=${now}`),
          loadCSS(`${scriptUrl}/observations.css`),
        ]).catch((err) => console.error('Failed to load observations widget:', err))
        break
    }

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
