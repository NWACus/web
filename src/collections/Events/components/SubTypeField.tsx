'use client'

import type { SelectFieldClientProps } from 'payload'

import { SelectField, useFormFields } from '@payloadcms/ui'
import React from 'react'

import { eventSubTypesData } from '../constants'

type Props = SelectFieldClientProps

export const SubTypeField = (props: Props) => {
  const typeField = useFormFields(([fields]) => fields.type)
  const providerField = useFormFields(([fields]) => fields.provider)

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
    if (!typeField?.value) return []

    // First filter by event type
    let allowedValues = eventSubTypesData
      .filter((subType) => subType.eventType === typeField.value)
      .map((subType) => ({
        label: subType.label,
        value: subType.value,
      }))

    // Then filter by provider's approved courseTypes if available
    if (providerCourseTypes) {
      allowedValues = allowedValues.filter((option) => providerCourseTypes.includes(option.value))
    }

    return allowedValues
  }, [typeField?.value, providerCourseTypes])

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
