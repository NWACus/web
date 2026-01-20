'use client'

import { useField } from '@payloadcms/ui'
import { FieldDescriptionClientComponent } from 'payload'

export const SponsorsLayoutDescription: FieldDescriptionClientComponent = ({ path }) => {
  const linkTypePath = path.replace(/\.label$/, '.type')
  const { value } = useField({ path: linkTypePath })

  let description
  switch (value) {
    case 'static':
      description = <>Use for one or multiple static logos.</>
      break
    case 'carousel':
      description = <>Creates a slideshow effect for logos (ideal for 4+ sponsors)</>
      break
    case 'banner':
      description = <>Uses full width display of single sponsor (ideal size 1280x200)</>
      break
    default:
      description = <>Select a layout to learn more</>
  }

  return <div className="field-description">{description}</div>
}
