'use client'

import { useEffect } from 'react'

export function NACContainerHijacker({ containerElementId }: { containerElementId: string }) {
  useEffect(function replaceNACContainerClassName() {
    const replaceContainerClassName = () => {
      const containerElement = document.getElementById(`${containerElementId}`)

      if (containerElement && containerElement.classList.contains('nac-container')) {
        containerElement.classList.remove('nac-container')
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && document.querySelector(`#${containerElementId}`)) {
          replaceContainerClassName()
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
