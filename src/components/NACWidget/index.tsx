'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export type Widget = 'map' | 'forecast' | 'warning' | 'stations' | 'observations'

export function NACWidget({ center, widget }: { center: string; widget: Widget }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9))

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ''

    const widgetId = `nac-widget-${widget}-${instanceId}`

    const appDiv = document.createElement('div')
    appDiv.id = widgetId
    containerRef.current.appendChild(appDiv)

    const awsBucket =
      process.env.NEXT_PUBLIC_NAC_WIDGETS_BUCKET || 'https://du6amfiq9m9h7.cloudfront.net'
    const version = process.env.NEXT_PUBLIC_NAC_WIDGETS_VERSION || '20250313'
    const scriptUrl = `${awsBucket}/public/v2/${version}/`

    // Base URL (used for Google Analytics)
    const baseUrl = window.location.pathname

    const loadCSS = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
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
        const script = document.createElement('script')
        script.async = true
        script.type = 'module'
        script.onload = () => resolve(url)
        script.onerror = () => reject(url)
        script.src = url
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
          loadJS(`${scriptUrl}danger-map.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}danger-map.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load map widget:', err))
        break

      case 'forecast':
        window.forecastWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}forecasts.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}forecasts.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load forecast widget:', err))
        break

      case 'warning':
        window.warningWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}warnings.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}warnings.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load warning widget:', err))
        break

      case 'stations':
        window.stationWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}stations.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}stations.css?t=${Date.now()}`),
        ]).catch((err) => console.error('Failed to load stations widget:', err))
        break

      case 'observations':
        window.obsWidgetData = widgetData
        Promise.all([
          loadJS(`${scriptUrl}observations.js?t=${Date.now()}`),
          loadCSS(`${scriptUrl}observations.css?t=${Date.now()}`),
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
    }
  }, [center, widget, pathname, instanceId])

  useEffect(function hijackZoneLinks() {
    const modifyLinks = () => {
      const links = document.querySelectorAll<HTMLAnchorElement>('#nac-forecast-container a')

      links.forEach((link) => {
        const href = link.getAttribute('href')

        if (href && href.startsWith('#/')) {
          // Extract the zone from the format "#/{zone}/"
          const match = href.match(/#\/([^/]+)\//)

          if (match && match[1]) {
            const zone = match[1]
            const newHref = `/forecasts/avalanche/${zone}${href}`

            // Clone the node to remove all event listeners
            const newLink = link.cloneNode(true)

            if (newLink instanceof HTMLAnchorElement) {
              newLink.setAttribute('href', newHref)

              newLink.addEventListener('click', (e) => {
                e.preventDefault()
                router.push(newHref)
              })

              if (link.parentNode) {
                link.parentNode.replaceChild(newLink, link)
              }
            }
          }
        }
      })
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && document.querySelector('#nac-forecast-container a')) {
          modifyLinks()
          observer.disconnect()
        }
      }
    })

    const container = document.querySelector('#widget-container')
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return <div id="widget-container" ref={containerRef}></div>
}
