'use client'
import { TextFieldClientProps } from 'payload'
import React, { useCallback, useEffect, useRef } from 'react'

import { Button, FieldLabel, TextInput, useField, useForm, useFormFields } from '@payloadcms/ui'

import { Check, Lock } from 'lucide-react'
import { formatSlug } from './formatSlug'
import './index.scss'

type SlugComponentProps = {
  fieldToUse: string
  checkboxFieldPath: string
} & TextFieldClientProps

export const SlugComponent = ({
  field,
  fieldToUse,
  checkboxFieldPath: checkboxFieldPathFromProps,
  path,
  readOnly: readOnlyFromProps,
}: SlugComponentProps) => {
  const { label } = field

  const checkboxFieldPath = path?.includes('.')
    ? `${path}.${checkboxFieldPathFromProps}`
    : checkboxFieldPathFromProps

  const { value, setValue } = useField<string>({ path: path || field.name })

  const { dispatchFields } = useForm()

  // Track if user manually edited the slug while unlocked
  const hasManuallyEditedSlug = useRef(false)

  // The value of the checkbox (lock state)
  // Using separate useFormFields to minimize re-renders
  const checkboxValue = useFormFields(([fields]) => {
    return fields[checkboxFieldPath]?.value as boolean
  })

  // The value of the field we use to generate the slug
  const targetFieldValue = useFormFields(([fields]) => {
    return fields[fieldToUse]?.value as string
  })

  // Only auto-update slug when locked *and* user has not manually edited slug
  useEffect(() => {
    if (checkboxValue) {
      const formattedSlug = targetFieldValue ? formatSlug(targetFieldValue) : ''
      if (value !== formattedSlug && !hasManuallyEditedSlug.current) {
        setValue(formattedSlug)
        hasManuallyEditedSlug.current = false
      }
    }
  }, [checkboxValue, targetFieldValue, setValue, value])

  const handleLock = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const newCheckboxValue = !checkboxValue

      dispatchFields({
        type: 'UPDATE',
        path: checkboxFieldPath,
        value: newCheckboxValue,
      })
    },
    [checkboxValue, checkboxFieldPath, dispatchFields],
  )

  const readOnly = readOnlyFromProps || checkboxValue

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    hasManuallyEditedSlug.current = true
    setValue(e.target.value)
  }

  return (
    <div className="field-type slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path}`} label={label} />

        <Button className="lock-button" buttonStyle="none" onClick={handleLock}>
          {checkboxValue ? <Lock className="w-4" /> : <Check className="w-4" />}
        </Button>
      </div>

      <TextInput
        value={value}
        onChange={onChangeHandler}
        path={path || field.name}
        readOnly={Boolean(readOnly)}
      />
    </div>
  )
}
