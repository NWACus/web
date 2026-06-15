'use client'

import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { useConfig, useField } from '@payloadcms/ui'
import { UIFieldClientComponent } from 'payload'
import { useEffect, useRef, useState } from 'react'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'

export const InitialTimezoneSetter: UIFieldClientComponent = () => {
  const { value: startDateTz, setValue: setStartDateTz } = useField<string>({
    path: 'startDate_tz',
  })
  const { value: endDateTz, setValue: setEndDateTz } = useField<string>({ path: 'endDate_tz' })
  const { value: registrationDeadlineTz, setValue: setRegistrationDeadlineTz } = useField<string>({
    path: 'registrationDeadline_tz',
  })
  const { selectedTenantSlug } = useTenantSelection()
  const { config } = useConfig()
  const [tenantTz, setTenantTz] = useState<string | undefined>(undefined)
  const [tzReady, setTzReady] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(
    function fetchTenantTimezone() {
      if (!selectedTenantSlug) {
        setTzReady(true)
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      fetch(
        `${config.serverURL}${config.routes.api}/tenants?where[slug][equals]=${selectedTenantSlug}&select[timezone]=true&depth=0&limit=1`,
        { credentials: 'include', signal: controller.signal },
      )
        .then((res) => res.json())
        .then((result) => {
          const tz = result.docs?.[0]?.timezone
          if (tz && TIMEZONE_OPTIONS.some((opt) => opt.value === tz)) {
            setTenantTz(tz)
          }
        })
        .catch(() => {})
        .finally(() => setTzReady(true))

      return () => controller.abort()
    },
    [selectedTenantSlug, config.serverURL, config.routes.api],
  )

  useEffect(
    function setInitialStartDateTimezone() {
      if (!tzReady || startDateTz || !setStartDateTz) return

      let defaultTz: string | undefined

      if (tenantTz) {
        defaultTz = tenantTz
      } else {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const matchingOption = TIMEZONE_OPTIONS.find((option) => option.value === browserTimezone)
        if (matchingOption) {
          defaultTz = matchingOption.value
        }
      }

      if (defaultTz) {
        // Use setTimeout to let Payload's date field initialize first
        setTimeout(() => {
          setStartDateTz(defaultTz)
        }, 0)
      }
    },
    [tzReady, tenantTz, startDateTz, setStartDateTz],
  )

  useEffect(
    function ensureEndDateTzMatchesStartDateTz() {
      if (startDateTz && startDateTz !== endDateTz) {
        setTimeout(() => {
          setEndDateTz(startDateTz)
        })
      }
    },
    [endDateTz, setEndDateTz, startDateTz],
  )

  useEffect(
    function ensureRegistrationDeadlineTzMatchesStartDateTz() {
      if (startDateTz && startDateTz !== registrationDeadlineTz) {
        setTimeout(() => {
          setRegistrationDeadlineTz(startDateTz)
        })
      }
    },
    [registrationDeadlineTz, setRegistrationDeadlineTz, startDateTz],
  )

  return null
}
