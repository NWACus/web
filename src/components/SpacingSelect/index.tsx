'use client'

import { hasBackgroundColor } from '@/fields/color'
import { SelectField, useField, useFormFields } from '@payloadcms/ui'
import type { SelectFieldClientProps } from 'payload'
import { useEffect } from 'react'

// Picking a color while spacing is None moves it to Small, since None isn't offered with a color
export const SpacingSelect = (props: SelectFieldClientProps) => {
  const { path } = props
  const colorPath = path.split('.').slice(0, -1).concat('backgroundColor').join('.')
  const color = useFormFields(([fields]) => fields[colorPath]?.value)
  const { value, setValue } = useField<string>({ path })

  useEffect(() => {
    if (value === 'none' && hasBackgroundColor(color)) setValue('sm')
  }, [color, value, setValue])

  return <SelectField {...props} />
}
