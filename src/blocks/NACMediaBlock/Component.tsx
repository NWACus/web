'use client'

import { NACWidget } from '@/components/NACWidget'
import type { NACMediaBlock as NACMediaBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import { useEffect, useState } from 'react'

export const NACMediaBlockComponent = (props: NACMediaBlockProps) => {
  const { backgroundColor, mode, tenant, wrapInContainer } = props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const center = typeof tenant === 'object' && tenant !== null ? tenant.slug : null

  useEffect(() => {
    if (!center) return

    const fetchData = async () => {
      const response = await fetch(`/api/${center}/nac-media`)
      const result = await response.json()
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [center])

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  if (!center) return <div>Error loading media</div>

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
            widgetsVersion={data.version}
            widgetsBaseUrl={data.baseUrl}
            mediaMode={mode}
          />
        )}
      </div>
    </div>
  )
}
