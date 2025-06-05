'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export const useHash = (
  handleHashChanged?: (e: HashChangeEvent, prevHash: string | undefined) => void,
) => {
  const router = useRouter()
  const path = usePathname()
  const search = useSearchParams()

  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash : undefined)

  useEffect(() => {
    const onHashChanged = (e: HashChangeEvent) => {
      console.log('hashchange event, new hash: ', window.location.hash)

      if (typeof handleHashChanged === 'function') {
        handleHashChanged(e, hash)
      } else {
        setHash(window.location.hash)
      }
    }

    const { pushState, replaceState } = window.history

    // extend window.history pushState, replaceState functions
    window.history.pushState = function (...args) {
      console.log('pushState, args: ', args)

      pushState.apply(window.history, args)
      setTimeout(() => setHash(window.location.hash))
    }
    window.history.replaceState = function (...args) {
      console.log('replaceState, args: ', args)

      replaceState.apply(window.history, args)
      setTimeout(() => setHash(window.location.hash))
    }

    window.addEventListener('hashchange', onHashChanged)

    return () => {
      window.removeEventListener('hashchange', onHashChanged)
    }
  }, [])

  const setNewHash = (newHash: string) => {
    let newPath = path ?? ''
    if (search) newPath += `?${search.toString()}`
    if (newHash) {
      newPath += `#${newHash}`
    }
    router.replace(newPath, { scroll: false })
  }

  return { hash, setNewHash }
}
