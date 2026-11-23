'use client'

import { Sponsor } from '@/payload-types'
import { useAnalytics } from '@/utilities/useAnalytics'
import { useEffect, useRef } from 'react'

// The MRC's definition of a viewable display ad: half its pixels for one continuous second.
const VISIBLE_RATIO = 0.5
const VISIBLE_MS = 1000

type Props = {
  sponsor: Pick<Sponsor, 'id' | 'name' | 'link'>
  className?: string
  children: React.ReactNode
}

export function SponsorLink({ sponsor, className, children }: Props) {
  const { capture } = useAnalytics()
  const link = useRef<HTMLAnchorElement>(null)

  const eventProperties = {
    sponsor_id: String(sponsor.id),
    sponsor_name: sponsor.name,
  }

  useEffect(() => {
    const element = link.current
    if (!element) return

    let viewTimer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if ((entries.at(-1)?.intersectionRatio ?? 0) < VISIBLE_RATIO) {
          clearTimeout(viewTimer)
          viewTimer = undefined
          return
        }
        viewTimer ??= setTimeout(() => {
          observer.disconnect()
          capture('sponsor_impression', eventProperties)
        }, VISIBLE_MS)
      },
      { threshold: VISIBLE_RATIO },
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
      clearTimeout(viewTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <a
      ref={link}
      href={sponsor.link}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => capture('sponsor_click', eventProperties)}
    >
      {children}
    </a>
  )
}
