'use client'
import { TextFieldClientProps } from 'payload'
import React, { useCallback } from 'react'

import { Button, FieldLabel, TextInput, useField, useFormFields } from '@payloadcms/ui'

import { RefreshCw } from 'lucide-react'
import { formatDateForSlug, formatSlug } from './formatSlug'

type SlugComponentProps = {
  fieldToUse: string
  dateField?: string
} & TextFieldClientProps

export const SlugComponent = ({
  field,
  fieldToUse,
  dateField,
  path,
  readOnly: readOnlyFromProps,
}: SlugComponentProps) => {
  const { label } = field

  const { value, setValue } = useField<string>({ path: path || field.name })
  const { value: currentSlug } = useField<string>({ path: 'slug' })

  // Read the source field and the optional date as primitive strings so the subscription stays
  // referentially stable across renders.
  const baseSlug = useFormFields(([fields]) => {
    const fieldValue = fields[fieldToUse]?.value
    return typeof fieldValue === 'string' ? formatSlug(fieldValue) : ''
  })
  const dateSlug = useFormFields(([fields]) =>
    dateField ? formatDateForSlug(fields[dateField]?.value) : '',
  )

  const handleGenerate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const newSlug = [baseSlug, dateSlug].filter(Boolean).join('-')
      if (newSlug && newSlug !== currentSlug) {
        setValue(newSlug)
      }
    },
    [baseSlug, dateSlug, currentSlug, setValue],
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
