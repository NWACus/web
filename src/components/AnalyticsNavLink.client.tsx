'use client'

import { Link, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'

/** Sidebar entry for the Site analytics view, styled like Payload's own nav links. */
export function AnalyticsNavLink() {
  const { config } = useConfig()
  const href = `${config.routes.admin}/analytics`
  const active = usePathname() === href

  return (
    <Link className="nav__link" href={href} aria-current={active ? 'page' : undefined}>
      {active && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Site Analytics</span>
    </Link>
  )
}
