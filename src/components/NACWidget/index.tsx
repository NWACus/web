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

        // Insert before the first stylesheet so other styles take precedence
        const firstStyle = document.head.querySelector('link[rel="stylesheet"], style')
        if (firstStyle) {
          document.head.insertBefore(link, firstStyle)
        } else {
          document.head.prepend(link)
        }
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

  useEffect(() => {
    // Function to modify links
    const modifyLinks = () => {
      // Select all <a> tags within the container
      const links = document.querySelectorAll('#nac-forecast-container a')

      // Filter and modify links
      links.forEach((link) => {
        const href = link.getAttribute('href')

        // Check if the href starts with "#/"
        if (href && href.startsWith('#/')) {
          // Extract the zone from the format "#/{zone}/"
          const match = href.match(/#\/([^/]+)\//)

          if (match && match[1]) {
            const zone = match[1]
            // Create the new href format: "{zone}#/{zone}/"
            const newHref = `/forecasts/avalanche/${zone}${href}`

            // Clone the node to remove all event listeners and cast to HTMLAnchorElement
            const newLink = link.cloneNode(true) as HTMLAnchorElement

            // Set the new href
            newLink.setAttribute('href', newHref)

            // Add a click handler to use Next.js router
            newLink.addEventListener('click', (e) => {
              e.preventDefault()
              router.push(newHref)
            })

            // Replace the original link
            if (link.parentNode) {
              link.parentNode.replaceChild(newLink, link)
            }
          }
        }
      })
    }

    // Create a MutationObserver to watch for when links are added
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && document.querySelector('#nac-forecast-container a')) {
          // Links have been added, modify them
          modifyLinks()

          // Optional: disconnect after first detection if you know links are
          // all added at once and don't change afterwards
          // observer.disconnect();
        }
      }
    })

    // Start observing the container for changes
    const container = document.querySelector('#widget-container')
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
      })
    }

    // Also try to run once in case links are already there
    setTimeout(modifyLinks, 500)

    // Cleanup function to disconnect observer
    return () => {
      observer.disconnect()
    }
  }, [])

  return <div id="widget-container" ref={containerRef}></div>
}
