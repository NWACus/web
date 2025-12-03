'use client'

import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { useField } from '@payloadcms/ui'
import { UIFieldClientComponent } from 'payload'
import { useEffect } from 'react'

export const InitialTimezoneSetter: UIFieldClientComponent = () => {
  const { value: startDateTz, setValue: setStartDateTz } = useField<string>({
    path: 'startDate_tz',
  })
  const { value: endDateTz, setValue: setEndDateTz } = useField<string>({ path: 'endDate_tz' })
  const { value: registrationDeadlineTz, setValue: setRegistrationDeadlineTz } = useField<string>({
    path: 'registrationDeadline_tz',
  })

  useEffect(
    function setInitialStartDateTimezone() {
      if (!startDateTz && setStartDateTz) {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const matchingOption = TIMEZONE_OPTIONS.find((option) => option.value === browserTimezone)
        if (matchingOption) {
          // Use setTimeout to let Payload's date field initialize first
          setTimeout(() => {
            setStartDateTz(matchingOption.value)
          }, 0)
        }
      }
    },
    [startDateTz, setStartDateTz],
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
