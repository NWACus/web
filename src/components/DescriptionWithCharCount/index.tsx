'use client'

import { cn } from '@/utilities/ui'
import { useField } from '@payloadcms/ui'
import { TextareaFieldDescriptionClientComponent } from 'payload'

/**
 * Field description that appends a live "used/allowed characters" counter, driven by the field's
 * own `maxLength`. Pair it with a `maxLength` on any textarea field whose limit editors need to see
 * while typing — `maxLength` is validation-only, so without a counter the limit is invisible until
 * publish fails. Helper text still comes from the field's `admin.description`.
 */
export const DescriptionWithCharCount: TextareaFieldDescriptionClientComponent = ({
  className,
  field,
  marginPlacement,
  path,
}) => {
  const { value } = useField<string>({ path })

  const description = field?.admin?.description
  const helperText = typeof description === 'string' ? description : null
  const maxLength = field?.maxLength
  const length = value?.length ?? 0

  return (
    <div
      className={cn(
        'field-description',
        // Payload's per-field description class, e.g. `field-description-meta__title` — nested
        // paths swap their dots for double underscores so the result is a valid class name.
        `field-description-${path.replace(/\./g, '__')}`,
        marginPlacement && `field-description--margin-${marginPlacement}`,
        className,
      )}
    >
      {helperText}
      {typeof maxLength === 'number' && (
        <span className={cn(helperText && 'ml-1', length > maxLength && 'text-error')}>
          {length}/{maxLength} characters
        </span>
      )}
    </div>
  )
}
