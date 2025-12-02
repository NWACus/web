'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * This takes over the observation widdget's modal button that would normally open the observation in
 * a new tab and, depending on if it is an observation or an avalanche, sets a new href and adds a click
 * handler that uses the next.js router to navigate.
 */
export function ObservationLinkHijacker() {
  const router = useRouter()

  useEffect(
    function hijackObservationLinks() {
      const modifyLinks = () => {
        const links = document.querySelectorAll<HTMLAnchorElement>('#nac-obs-modal-controls a')

        links.forEach((link) => {
          const href = link.getAttribute('href')

          if (href && href.startsWith('#/')) {
            // Extract the observation id from the format "#/observation/{observation id}"
            const observationMatch = href.match(/#\/observation\/([^/]+)/)

            // Extract the observation id from the format "#/avalanche/{observation id}"
            const avalancheMatch = href.match(/#\/avalanche\/([^/]+)/)

            let newHref

            if (observationMatch && observationMatch[1]) {
              const observationId = observationMatch[1]
              newHref = `/observations/${observationId}#/observation/${observationId}`
            }

            if (avalancheMatch && avalancheMatch[1]) {
              const observationId = avalancheMatch[1]
              newHref = `/observations/avalanches/${observationId}#/avalanche/${observationId}`
            }

            if (newHref) {
              // Clone the node to remove all event listeners
              const newLink = link.cloneNode(true)

              if (newLink instanceof HTMLAnchorElement) {
                newLink.setAttribute('href', newHref)
                newLink.removeAttribute('target')

                newLink.addEventListener('click', (e) => {
                  e.preventDefault()
                  // Disable scroll to prevent the browser from scrolling to the hash fragment
                  router.push(newHref, { scroll: false })
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
          if (
            mutation.type === 'childList' &&
            document.querySelector('#nac-obs-modal-controls a')
          ) {
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
    },
    [router],
  )

  return null
}
