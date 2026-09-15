'use client'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import { getBrowserTimezone } from '@/utilities/getBrowserTimezone'
import { AVALANCHE_CENTERS, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { TIMEZONE_OPTIONS, timezonesAgreeAt } from '@/utilities/timezones'
import { useField } from '@payloadcms/ui'
import { UIFieldClientProps } from 'payload'
import { useEffect, useState } from 'react'

const timezoneLabel = (timezone: string) =>
  TIMEZONE_OPTIONS.find((option) => option.value === timezone)?.label ?? timezone

/**
 * Picks the timezone a new document should default to: the selected center's timezone when
 * editing under a tenant, otherwise the browser's timezone when it is one we support.
 */
export function defaultTimezoneFor(
  tenantSlug: string | undefined,
  browserTimezone: string,
): string | undefined {
  if (tenantSlug && isValidTenantSlug(tenantSlug)) {
    return AVALANCHE_CENTERS[tenantSlug].timezone
  }
  return TIMEZONE_OPTIONS.find((option) => option.value === browserTimezone)?.value
}

/** The instant the editor is scheduling, which is when the two timezones have to be compared. */
function comparisonInstant(startDate: string | undefined): Date {
  const startsAt = startDate ? new Date(startDate) : null
  return startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt : new Date()
}

type InitialTimezoneSetterProps = UIFieldClientProps & {
  /** Set by `startAndEndDateField({ defaultToCenterTimezone })` for tenant-scoped collections. */
  defaultToCenterTimezone?: boolean
}

export const InitialTimezoneSetter = ({
  defaultToCenterTimezone = false,
}: InitialTimezoneSetterProps) => {
  const { selectedTenantSlug } = useTenantSelection()
  const { value: startDate } = useField<string>({ path: 'startDate' })
  const { value: startDateTz, setValue: setStartDateTz } = useField<string>({
    path: 'startDate_tz',
  })
  const { value: endDateTz, setValue: setEndDateTz } = useField<string>({ path: 'endDate_tz' })
  const { value: registrationDeadlineTz, setValue: setRegistrationDeadlineTz } = useField<string>({
    path: 'registrationDeadline_tz',
  })
  // Read in an effect so the server render never depends on the viewer's timezone.
  const [browserTimezone, setBrowserTimezone] = useState<string>()

  useEffect(function readBrowserTimezone() {
    setBrowserTimezone(getBrowserTimezone())
  }, [])

  useEffect(
    function setInitialStartDateTimezone() {
      if (startDateTz || !setStartDateTz || !browserTimezone) return
      const centerSlug = defaultToCenterTimezone ? selectedTenantSlug : undefined
      const initial = defaultTimezoneFor(centerSlug, browserTimezone)
      if (initial) {
        // Use setTimeout to let Payload's date field initialize first
        setTimeout(() => {
          setStartDateTz(initial)
        }, 0)
      }
    },
    [browserTimezone, defaultToCenterTimezone, selectedTenantSlug, setStartDateTz, startDateTz],
  )

  useEffect(
    function keepOtherTimezonesInSyncWithStartDate() {
      if (!startDateTz) return
      setTimeout(() => {
        if (startDateTz !== endDateTz) setEndDateTz(startDateTz)
        if (startDateTz !== registrationDeadlineTz) setRegistrationDeadlineTz(startDateTz)
      })
    },
    [endDateTz, registrationDeadlineTz, setEndDateTz, setRegistrationDeadlineTz, startDateTz],
  )

  if (
    !startDateTz ||
    !browserTimezone ||
    timezonesAgreeAt(startDateTz, browserTimezone, comparisonInstant(startDate))
  ) {
    return null
  }

  return (
    <p className="field-description" role="status">
      Times are in {timezoneLabel(startDateTz)}. Your browser is in {timezoneLabel(browserTimezone)}
      .
    </p>
  )
}
