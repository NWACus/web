'use client'

import { useField } from '@payloadcms/ui'
import { FieldDescriptionClientComponent } from 'payload'

export const Description: FieldDescriptionClientComponent = ({ path }) => {
  const linkPath = path.split('.').slice(0, -1).join('.')
  const linkTypePath = [linkPath, 'type'].join('.')
  const field = useField({ path: linkTypePath })
  return (
    <div className="field-description">
      {field.value === 'internal'
        ? 'This will override the text of this nav item normally determined by the page title.'
        : 'The text of this nav item. Required for external links.'}
    </div>
  )
}
