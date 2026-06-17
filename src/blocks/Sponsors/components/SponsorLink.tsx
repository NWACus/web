'use client'

import { Sponsor } from '@/payload-types'
import { useAnalytics } from '@/utilities/useAnalytics'
import { useEffect, useRef } from 'react'

type Props = {
  sponsor: Pick<Sponsor, 'id' | 'name' | 'link'>
  className?: string
  children: React.ReactNode
}

/**
 * Wraps a sponsor banner in a tracked link. Fires a `sponsor_impression` PostHog event
 * once when the banner mounts and a `sponsor_click` event on click (both tagged with the
 * active tenant via useAnalytics).
 */
export function SponsorLink({ sponsor, className, children }: Props) {
  const { captureWithTenant } = useAnalytics()
  const impressionSent = useRef(false)

  const eventProperties = {
    sponsor_id: String(sponsor.id),
    sponsor_name: sponsor.name,
  }

  useEffect(() => {
    if (impressionSent.current) return
    impressionSent.current = true
    captureWithTenant('sponsor_impression', eventProperties)
    // Fire exactly once per mount; sponsor identity is stable for the lifetime of this link
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <a
      href={sponsor.link}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => captureWithTenant('sponsor_click', eventProperties)}
    >
      {children}
    </a>
  )
}
