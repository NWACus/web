'use client'

import { blockSpacing } from '@/components/BackgroundColorWrapper'
import { NACWidget } from '@/components/NACWidget'
import type { NACMediaBlock as NACMediaBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import * as Sentry from '@sentry/nextjs'

export const NACMediaBlockComponent = (props: NACMediaBlockProps) => {
  const { backgroundColor, mode } = props
  const { tenant } = useTenant()

  const center = typeof tenant === 'object' && tenant !== null ? tenant.slug : null

  const textColor = getTextColorFromBgColor(backgroundColor)
  const spacing = blockSpacing(backgroundColor, true)

  if (!center) {
    Sentry.captureException('NACMediaWidget: center not defined')
    return null
  }

  return (
    <div className={cn(spacing.outer, spacing.bg)}>
      <div className={cn('container w-full text-center', spacing.inner, textColor)}>
        <NACWidget center={center} widget={'media'} mediaMode={mode} />
      </div>
    </div>
  )
}
