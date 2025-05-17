'use client'
import { useEffect } from 'react'

export function ZoneHashHandler({ zone }: { zone: string }) {
  useEffect(() => {
    if (zone) {
      const url = new URL(window.location.href)

      if (!url.hash.includes(`/${zone}/`)) {
        window.location.replace(`${url.pathname}${url.search}#/${zone}/`)
      }
    }
  }, [zone])

  return null
}
