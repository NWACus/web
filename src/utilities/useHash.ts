'use client'

import { useEffect, useState } from 'react'

export function useHash() {
  const [hash, setHash] = useState('')

  useEffect(() => {
    // Set initial hash asynchronously
    setTimeout(() => {
      setHash(window.location.hash)
    }, 0)

    const updateHash = () => {
      // Defer state update to avoid useInsertionEffect error
      setTimeout(() => {
        setHash(window.location.hash)
      }, 0)
    }

    window.addEventListener('hashchange', updateHash)
    window.addEventListener('popstate', updateHash)

    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args)
      setTimeout(updateHash, 0)
    }

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args)
      setTimeout(updateHash, 0)
    }

    return () => {
      window.removeEventListener('hashchange', updateHash)
      window.removeEventListener('popstate', updateHash)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [])

  return hash
}
