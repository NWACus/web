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
  const { backgroundColor, mode, wrapInContainer } = props
  const { tenant } = useTenant()
  const [data, setData] = useState<NacWidgetConfigurationSchema>()
  const [loading, setLoading] = useState(true)

  const center = typeof tenant === 'object' && tenant !== null ? tenant.slug : null

  useEffect(() => {
    if (!center) return

    const fetchData = async () => {
      const response = await fetch(`/api/${center}/nac-config`)
      const result = await response.json()
      const parsed = nacWidgetConfigurationSchema.safeParse(response)
      if (parsed.success) {
        setData(result)
      } else {
        console.error('Invalid config:', parsed.error.errors)
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

  return (
    <div className={cn(!wrapInContainer && bgColorClass)}>
      <div
        className={cn(
          'py-4 w-full text-center',
          textColor,
          wrapInContainer && `${bgColorClass} container`,
        )}
      >
        {loading ? (
          <div> Loading...</div>
        ) : (
          <NACWidget
            center={center}
            widget={'media'}
            widgetsVersion={data?.version || ''}
            widgetsBaseUrl={data?.baseUrl || ''}
            mediaMode={mode}
          />
        )}
      </div>
    </div>
  )
}
