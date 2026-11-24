'use client'

/** A link to a zone's forecast page at its Mountain Weather section, native or widget. */
import Link from 'next/link'
import type { ReactNode } from 'react'

import { MOUNTAIN_WEATHER_ID } from './mountainWeatherId'

// A dated address redirects on a widget center, which drops the hash, so the click is kept too.
let clickedHref: string | null = null

export function ZoneWeatherLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={`${href}#${MOUNTAIN_WEATHER_ID}`}
      onNavigate={() => {
        clickedHref = href
      }}
      className={className}
    >
      {children}
    </Link>
  )
}

/** Whether the reader came to this page for its weather. A click answers once. */
export function takeWeatherRequest(): boolean {
  const { hash, pathname } = window.location
  const clicked = clickedHref === pathname || clickedHref?.startsWith(`${pathname}/`) === true
  clickedHref = null
  return clicked || hash === `#${MOUNTAIN_WEATHER_ID}`
}
