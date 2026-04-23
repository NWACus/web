'use client'
import { TextFieldClientProps } from 'payload'
import React, { useCallback } from 'react'

import { Button, FieldLabel, TextInput, useField, useFormFields } from '@payloadcms/ui'

import { RefreshCw } from 'lucide-react'
import { formatSlug } from './formatSlug'

type SlugComponentProps = {
  fieldToUse: string
} & TextFieldClientProps

export const SlugComponent = ({
  field,
  fieldToUse,
  path,
  readOnly: readOnlyFromProps,
}: SlugComponentProps) => {
  const { label } = field

  const { value, setValue } = useField<string>({ path: path || field.name })
  const { value: currentSlug } = useField<string>({ path: 'slug' })

  // Get the current value of the title field
  const targetFieldValue = useFormFields(([fields]) => {
    const value = fields[fieldToUse]?.value
    return typeof value === 'string' ? value : ''
  })

  const handleGenerate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const newSlug = formatSlug(targetFieldValue)
      if (targetFieldValue && newSlug !== currentSlug) {
        setValue(formatSlug(targetFieldValue))
      }
    },
    [targetFieldValue, currentSlug, setValue],
  )
  const readOnly = readOnlyFromProps || false

  return (
    <div className="field-type relative">
      <div className="flex justify-between items-center">
        <FieldLabel htmlFor={`field-${path}`} label={label} required />

        <Button
          className="absolute right-0 bottom-[0.4em] z-[1] m-0 pb-[0.3125rem]"
          buttonStyle="icon-label"
          onClick={handleGenerate}
        >
          <RefreshCw className="w-4" />
        </Button>
      </div>

      <TextInput
        value={value}
        onChange={setValue}
        path={path || field.name}
        readOnly={Boolean(readOnly)}
      />
    </div>
  )
}
