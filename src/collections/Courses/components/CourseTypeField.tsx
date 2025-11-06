'use client'

import type { SelectFieldClientProps } from 'payload'

import { SelectField, useField, useFormFields } from '@payloadcms/ui'
import React from 'react'

import { courseTypesData } from '../constants'

type Props = SelectFieldClientProps

export const CourseTypeField = (props: Props) => {
  const providerField = useFormFields(([fields]) => fields.provider)
  const { value: courseTypeValue, setValue: setCourseTypeValue } = useField<string>({
    path: 'courseType',
  })

  const [providerCourseTypes, setProviderCourseTypes] = React.useState<string[] | null>(null)

  // Fetch provider's approved courseTypes when provider changes
  React.useEffect(() => {
    const fetchProviderData = async () => {
      if (!providerField?.value) {
        setProviderCourseTypes(null)
        return
      }

      try {
        const providerId =
          typeof providerField.value === 'number' ? providerField.value : providerField.value
        const response = await fetch(`/api/providers/${providerId}?depth=0`)
        if (response.ok) {
          const provider = await response.json()
          setProviderCourseTypes(
            provider?.courseTypes
              ? Array.isArray(provider.courseTypes)
                ? provider.courseTypes
                : [provider.courseTypes]
              : null,
          )
        }
      } catch (error) {
        console.error('Failed to fetch provider data:', error)
      }
    }

    fetchProviderData()
  }, [providerField?.value])

  // Filter options based on type and provider's approved courseTypes
  const filteredOptions = React.useMemo(() => {
    if (!providerCourseTypes) return []

    return courseTypesData.filter((option) => providerCourseTypes.includes(option.value))
  }, [providerCourseTypes])

  // Clear courseType field if current value is not in allowed values
  React.useEffect(() => {
    if (courseTypeValue && filteredOptions.length > 0) {
      const isValueAllowed = filteredOptions.some((option) => option.value === courseTypeValue)
      if (!isValueAllowed) {
        setCourseTypeValue(null)
      }
    }
  }, [filteredOptions, courseTypeValue, setCourseTypeValue])

  // Create a new props object with filtered options
  const modifiedProps = {
    ...props,
    field: {
      ...props.field,
      options: filteredOptions,
    },
  }

  return <SelectField {...modifiedProps} />
}
