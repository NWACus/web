'use client'
import { useEffect } from 'react'

export function WidgetHashHandler({ initialHash }: { initialHash: string }) {
  useEffect(() => {
    const url = new URL(window.location.href)

    if (!url.hash.includes(initialHash)) {
      window.location.replace(`${url.pathname}${url.search}#${initialHash}`)
    }
  }, [initialHash])

  return null
}
