'use client'

import { NACWidget } from '@/components/NACWidget'
import type { NACMediaBlock as NACMediaBlockProps } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import {
  NacWidgetConfigurationSchema,
  nacWidgetConfigurationSchema,
} from '@/services/nac/types/schemas'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import * as Sentry from '@sentry/nextjs'
import { useEffect, useState } from 'react'

export const NACMediaBlockComponent = (props: NACMediaBlockProps) => {
  const { backgroundColor, mode } = props
  const { tenant } = useTenant()
  const [data, setData] = useState<NacWidgetConfigurationSchema>()
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState<boolean>(false)

  const center = typeof tenant === 'object' && tenant !== null ? tenant.slug : null

  useEffect(() => {
    if (!center) return

    const fetchData = async () => {
      const response = await fetch(`/api/${center}/nac-config`)
      const result = await response.json()
      const parsed = nacWidgetConfigurationSchema.safeParse(result)

      if (parsed.success) {
        setData(result)
      } else {
        setHasError(true)
        const errors = parsed.error.message
        Sentry.captureException(`Error parsing /api/${center}/nac-config response: ${errors}`)
      }

      setLoading(false)
    }
    fetchData()
  }, [center])

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  if (!center) {
    Sentry.captureException('NACMediaWidget: center not defined')
    return null
  }
  if (!loading && hasError) return null

  return (
    <div className={cn(bgColorClass)}>
      <div className={cn('container py-4 w-full text-center ', textColor)}>
        {(loading || (!data && !hasError)) && <div> Loading...</div>}

        {!loading && data && (
          <NACWidget
            center={center}
            widget={'media'}
            widgetsVersion={data.version}
            widgetsBaseUrl={data.baseUrl}
            mediaMode={mode}
          />
        )}
      </div>
    </div>
  )
}
