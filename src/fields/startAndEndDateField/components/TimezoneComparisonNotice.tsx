'use client'

import { useField } from '@payloadcms/ui'
import { UIFieldClientComponent } from 'payload'
import { useEffect, useState } from 'react'

import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { tzName } from '@date-fns/tz'

export const TimezoneComparisonNotice: UIFieldClientComponent = () => {
  const { value: startDateTz } = useField<string>({ path: 'startDate_tz' })
  const [browserTzName, setBrowserTzName] = useState<string | null>(null)

  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!startDateTz || browserTz === startDateTz) {
      setBrowserTzName(null)
      return
    }
    if (!TIMEZONE_OPTIONS.some((opt) => opt.value === browserTz)) {
      setBrowserTzName(null)
      return
    }
    setBrowserTzName(tzName(browserTz, new Date(), 'long'))
  }, [startDateTz])

  if (!browserTzName || !startDateTz) return null

  const eventTzLabel =
    TIMEZONE_OPTIONS.find((opt) => opt.value === startDateTz)?.label ?? startDateTz

  return (
    <p className="text-sm text-amber-700 dark:text-amber-400">
      Note: This event&apos;s timezone ({eventTzLabel}) differs from your browser&apos;s timezone (
      {browserTzName}).
    </p>
  )
}
