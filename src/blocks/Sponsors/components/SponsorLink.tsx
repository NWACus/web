'use client'

import { Sponsor } from '@/payload-types'
import { useAnalytics } from '@/utilities/useAnalytics'
import { useEffect, useRef } from 'react'

type Props = {
  sponsor: Pick<Sponsor, 'id' | 'name' | 'link'>
  className?: string
  children: React.ReactNode
}

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
