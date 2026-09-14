import { FieldHook } from 'payload'

export const clearIrrelevantLinkValues: FieldHook = ({ value }) => {
  // Skip if not a link object
  if (value === null || typeof value !== 'object') return value

  const { type } = value

  if (type === 'internal') {
    // Clear external-only field when switching to internal.
    // newTab is cleared by its own field-level hook so array-context links are covered too.
    const { url: _url, ...rest } = value
    return rest
  }

  if (type === 'external') {
    // Clear internal-only field when switching to external
    const { reference: _reference, ...rest } = value
    return rest
  }

  return value
}
