import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

export const validateEventDates: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data
  }

  const errors: { message: string; path: string }[] = []

  // Validate endDate is after startDate
  if (data.endDate && data.startDate) {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate <= startDate) {
      errors.push({
        message: 'End date must be after start date.',
        path: 'endDate',
      })
    }
  }

  // Validate registrationDeadline is before startDate
  if (data.registrationDeadline && data.startDate) {
    const registrationDeadline = new Date(data.registrationDeadline)
    const startDate = new Date(data.startDate)

    if (registrationDeadline >= startDate) {
      errors.push({
        message: 'Registration deadline must be before start date.',
        path: 'registrationDeadline',
      })
    }
  }

  // Validate all timezone fields match
  const startDateTz = data.startDate_tz
  if (startDateTz) {
    if (data.endDate_tz && data.endDate_tz !== startDateTz) {
      errors.push({
        message: `End date timezone must match start date timezone (${startDateTz}).`,
        path: 'endDate_tz',
      })
    }

    if (data.registrationDeadline_tz && data.registrationDeadline_tz !== startDateTz) {
      errors.push({
        message: `Registration deadline timezone must match start date timezone (${startDateTz}).`,
        path: 'registrationDeadline_tz',
      })
    }
  }

  if (errors.length > 0) {
    throw new ValidationError({ errors })
  }

  return data
}
