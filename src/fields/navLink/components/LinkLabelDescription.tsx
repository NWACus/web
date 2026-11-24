'use client'

import { useField } from '@payloadcms/ui'
import { FieldDescriptionClientComponent } from 'payload'

export const LinkLabelDescription: FieldDescriptionClientComponent = ({ path }) => {
  if (!path.includes('link.label')) {
    console.warn("This Description component should only be used in the navLink's label field.")
  }

  // Convert label path to type path
  // Example: 'weather.items.0.link.label' → 'weather.items.0.link.type'
  const linkTypePath = path.replace(/\.label$/, '.type')

  const field = useField({ path: linkTypePath })

  return (
    <div className="field-description">
      {field.value === 'internal'
        ? 'Uses the page title if left blank.'
        : 'Required for web addresses.'}
    </div>
  )
}
