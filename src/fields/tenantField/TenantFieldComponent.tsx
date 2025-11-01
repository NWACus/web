'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField, useField, useFormModified } from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'

type Props = {
  required?: boolean
  showInputInDocumentView?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantFieldComponent = (args: Props) => {
  const { required, showInputInDocumentView: showFieldInDoc, unique } = args
  const { setValue, value } = useField<number | string>()
  const modified = useFormModified()
  const {
    options,
    selectedTenantID,
    setEntityType: setEntityType,
    setModified,
    setTenant,
  } = useTenantSelection()

  const isGlobalCollection = !!unique
  const hasSetValueRef = React.useRef(false)

  React.useEffect(() => {
    if (!hasSetValueRef.current && !isGlobalCollection) {
      // set value on load
      if (value && value !== selectedTenantID) {
        setTenant({ id: value, refresh: unique })
      } else if (required) {
        // in the document view, the tenant field should always have a value
        const defaultValue = selectedTenantID || options[0]?.value
        setTenant({ id: defaultValue, refresh: unique })
      }
      hasSetValueRef.current = true
    } else if ((!value || value !== selectedTenantID) && required) {
      // Update the field on the document value when the tenant is changed
      setValue(selectedTenantID, !value || value === selectedTenantID)
    } else if (value && value !== selectedTenantID) {
      setTenant({ id: value })
    }
  }, [value, selectedTenantID, setTenant, setValue, options, unique, isGlobalCollection, required])

  React.useEffect(() => {
    setEntityType(unique ? 'global' : 'document')
    return () => {
      setEntityType(undefined)
    }
  }, [unique, setEntityType])

  React.useEffect(() => {
    // sync form modified state with the tenant selection provider context
    setModified(modified)

    return () => {
      setModified(false)
    }
  }, [modified, setModified])

  if (showFieldInDoc) {
    return <RelationshipField {...args} />
  }

  return null
}
