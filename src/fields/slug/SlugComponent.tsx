'use client'
import { cn } from '@/utilities/ui'
import { TextFieldClientProps } from 'payload'
import React, { useCallback, useState } from 'react'

import {
  Button,
  FieldDescription,
  FieldLabel,
  TextInput,
  useField,
  useFormFields,
} from '@payloadcms/ui'

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
  const description = field?.admin?.description

  const { value, setValue } = useField<string>({ path: path || field.name })
  const { value: currentSlug } = useField<string>({ path: 'slug' })

  const [spinning, setSpinning] = useState(false)

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
      setSpinning(true)
      window.setTimeout(() => setSpinning(false), 300)
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
          className="absolute right-1 top-9 z-[1] m-0 p-1 bg-[var(--theme-input-bg)]"
          buttonStyle="icon-label"
          onClick={handleGenerate}
        >
          <RefreshCw className={cn('w-4', spinning && 'animate-spin [animation-duration:300ms]')} />
        </Button>
      </div>

      <TextInput
        value={value}
        onChange={setValue}
        path={path || field.name}
        readOnly={Boolean(readOnly)}
      />

      {description && <FieldDescription description={description} path={path || field.name} />}
    </div>
  )
}
