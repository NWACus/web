'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'

// We can't access searchParams in layouts without making them client components
// so this sets styles based on query params on the html and body tags to avoid flashes
// of the default colors (i.e. white background) on resizes
export function CustomEmbedStyles() {
  const [backgroundColor] = useQueryState('backgroundColor', parseAsString)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body

    if (backgroundColor) {
      html.style.backgroundColor = backgroundColor
      body.style.backgroundColor = backgroundColor
    }

    return () => {
      // Cleanup on unmount
      if (backgroundColor) {
        html.style.backgroundColor = ''
        body.style.backgroundColor = ''
      }
    }
  }, [backgroundColor])

  return null
}
