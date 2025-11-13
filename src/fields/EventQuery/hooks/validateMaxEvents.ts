import type { FieldHook } from 'payload'

export const validateMaxEvents: FieldHook = ({ value }) => {
  if (value === undefined || value === null) {
    return value
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (!Number.isInteger(numValue)) {
    return Math.floor(numValue)
  }

  return numValue
}
