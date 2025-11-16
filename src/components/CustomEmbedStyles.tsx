'use client'

import { useEffect } from 'react'

// We can't access searchParams in layouts without making them client components
// so this sets styles passed as params on the html and body tags to avoid flashes
// of the default colors (i.e. white background) on resizes
export function CustomEmbedStyles({
  backgroundColor,
  textColor,
}: {
  backgroundColor?: string | null
  textColor?: string | null
}) {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body

    if (backgroundColor) {
      html.style.backgroundColor = backgroundColor
      body.style.backgroundColor = backgroundColor
    }

    if (textColor) {
      html.style.color = textColor
      body.style.color = textColor
    }

    return () => {
      // Cleanup on unmount
      if (backgroundColor) {
        html.style.backgroundColor = ''
        body.style.backgroundColor = ''
      }
      if (textColor) {
        html.style.color = ''
        body.style.color = ''
      }
    }
  }, [backgroundColor, textColor])

  return null
}
