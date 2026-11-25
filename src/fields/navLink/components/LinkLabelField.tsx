'use client'

import { useReferenceDoc } from '@/components/Navigations/referenceDoc'
import { TextField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

/** The menu text, with the linked page's title as its placeholder. */
export const LinkLabelField = (props: TextFieldClientProps) => {
  const linkPath = props.path.replace(/\.label$/, '')
  const reference = useFormFields(([fields]) =>
    fields[`${linkPath}.type`]?.value === 'external'
      ? undefined
      : fields[`${linkPath}.reference`]?.value,
  )
  const { title } = useReferenceDoc(reference, [])
  const field = { ...props.field, admin: { ...props.field.admin, placeholder: title } }
  return <TextField {...props} field={field} />
}
