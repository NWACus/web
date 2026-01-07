'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField, useField, useFormInitializing, useFormModified } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import './index.scss'

const baseClass = 'tenantField'

type Props = {
  debug?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantFieldComponent = (args: Props) => {
  const { debug, unique } = args
  const { setValue, value, formInitializing } = useField<number | string>()
  const modified = useFormModified()
  const formInitializingContext = useFormInitializing()
  const {
    options,
    selectedTenantID,
    setEntityType: setEntityType,
    setModified,
    setTenant,
  } = useTenantSelection()

  const isGlobalCollection = !!unique
  const hasSetValueRef = useRef(false)

  // Track whether form has finished initializing
  const formReady = !formInitializing && !formInitializingContext

  useEffect(() => {
    // Don't try to set values while the form is still initializing
    if (!formReady) {
      return
    }

    if (!hasSetValueRef.current && !isGlobalCollection) {
      // set value on load
      if (value && value !== selectedTenantID) {
        setTenant({ id: value, refresh: unique })
      } else {
        // in the document view, the tenant field should always have a value
        const defaultValue = selectedTenantID || options[0]?.value
        setTenant({ id: defaultValue, refresh: unique })
        // Also set the field value when form is ready if we have a tenant selected
        // This handles the case where selectedTenantID is already correct from the cookie
        // and setTenant won't trigger a re-render
        if (defaultValue) {
          setValue(defaultValue, true)
        }
      }
      hasSetValueRef.current = true
    } else if (!value || value !== selectedTenantID) {
      // Update the field on the document value when the tenant is changed
      setValue(selectedTenantID, !value || value === selectedTenantID)
    }
  }, [
    value,
    selectedTenantID,
    setTenant,
    setValue,
    options,
    unique,
    isGlobalCollection,
    formReady,
    formInitializing,
    formInitializingContext,
  ])

  useEffect(() => {
    setEntityType(unique ? 'global' : 'document')
    return () => {
      setEntityType(undefined)
    }
  }, [unique, setEntityType])

  useEffect(() => {
    // sync form modified state with the tenant selection provider context
    setModified(modified)

    return () => {
      setModified(false)
    }
  }, [modified, setModified])

  if (debug) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__wrapper`}>
          <RelationshipField {...args} />
        </div>
        <div className={`${baseClass}__hr`} />
      </div>
    )
  }

  return null
}
