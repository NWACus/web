'use client'

import { NACWidget } from '@/components/NACWidget'
import type { NACMediaBlock as NACMediaBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export const NACMediaBlockComponent = (props: NACMediaBlockProps) => {
  const { backgroundColor, mode } = props
  const { tenant } = useTenant()

  const center = typeof tenant === 'object' && tenant !== null ? tenant.slug : null

  useEffect(() => {
    if (!center) Sentry.captureMessage('NACMediaWidget: center not defined', 'error')
  }, [center])

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  if (!center) return null

  return (
    <div className={cn(bgColorClass)}>
      <div className={cn('container py-4 w-full text-center ', textColor)}>
        <NACWidget center={center} widget={'media'} mediaMode={mode} />
      </div>
    </div>
  )
}
