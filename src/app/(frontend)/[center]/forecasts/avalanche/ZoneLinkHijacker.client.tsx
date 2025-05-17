'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ZoneLinkHijacker() {
  const router = useRouter()

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
            const newHref = `/forecasts/avalanche/${zone}`

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

  return null
}
