'use client'

import { Link, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const NAV_GROUP = 'Settings'

/**
 * The list element of the sidebar group labelled `label`, or null when there is none. Payload
 * builds nav groups only from collections and globals, so a custom link has to join one by DOM.
 */
function useNavGroupList(label: string): HTMLElement | null | undefined {
  const [list, setList] = useState<HTMLElement | null>()
  useEffect(() => {
    const group = Array.from(document.querySelectorAll('.nav-group')).find(
      (candidate) => candidate.querySelector('.nav-group__label')?.textContent === label,
    )
    const content = group?.querySelector('.nav-group__content')
    setList(content instanceof HTMLElement ? content : null)
  }, [label])
  return list
}

/** Sidebar entry for the Web Analytics view, listed under Settings like Payload's own links. */
export function AnalyticsNavLink() {
  const { config } = useConfig()
  const href = `${config.routes.admin}/analytics`
  const active = usePathname() === href
  const groupList = useNavGroupList(NAV_GROUP)

  const link = (
    <Link className="nav__link" href={href} aria-current={active ? 'page' : undefined}>
      {active && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Web Analytics</span>
    </Link>
  )
  // Not looked up yet: render nothing rather than flash the link below the groups
  if (groupList === undefined) return null
  // A user who can see nothing under Settings still gets the link, after the groups
  return groupList ? createPortal(link, groupList) : link
}
