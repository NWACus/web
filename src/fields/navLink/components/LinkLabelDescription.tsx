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
        ? 'This will override the text of this nav item normally determined by the page title.'
        : 'The text of this nav item. Required for external links.'}
    </div>
  )
}
