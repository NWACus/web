'use client'

import { Button } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Payload has no slot beside "Create New" in the list header, so this portals into that
 * container and copies its button style. Renders nothing if the container isn't there.
 */
export function ImportCoursesButton({ url }: { url: string }) {
  const [container, setContainer] = useState<Element | null>(null)

  useEffect(() => {
    setContainer(document.querySelector('.list-header__title-actions'))
  }, [])

  if (!container) return null

  return createPortal(
    <Button buttonStyle="pill" el="link" size="small" url={url}>
      Import courses
    </Button>,
    container,
  )
}
