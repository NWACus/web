'use client'

import { Button } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const TITLE_ACTIONS = '.list-header__title-actions'
// The header renders with the list; stop watching if it never shows (e.g. no Create permission)
const GIVE_UP_AFTER_MS = 10_000

// Payload has no slot beside "Create New", so this portals into the list header, waiting for it
// to mount.
export function ImportCoursesButton({ url }: { url: string }) {
  const [container, setContainer] = useState<Element | null>(null)

  useEffect(() => {
    const found = document.querySelector(TITLE_ACTIONS)
    if (found) return setContainer(found)
    const observer = new MutationObserver(() => {
      const appeared = document.querySelector(TITLE_ACTIONS)
      if (!appeared) return
      setContainer(appeared)
      observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const giveUp = setTimeout(() => observer.disconnect(), GIVE_UP_AFTER_MS)
    return () => {
      clearTimeout(giveUp)
      observer.disconnect()
    }
  }, [])

  if (!container) return null

  return createPortal(
    <Button buttonStyle="pill" el="link" size="small" url={url}>
      Import courses
    </Button>,
    container,
  )
}
