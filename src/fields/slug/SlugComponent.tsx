'use client'
import { TextFieldClientProps } from 'payload'
import React, { useCallback } from 'react'

import { Button, FieldLabel, TextInput, useField, useFormFields } from '@payloadcms/ui'

import { RefreshCw } from 'lucide-react'
import { formatSlug } from './formatSlug'
import './index.scss'

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
    <div className="field-type slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path}`} label={label} required />

        <Button className="generate-button" buttonStyle="icon-label" onClick={handleGenerate}>
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
