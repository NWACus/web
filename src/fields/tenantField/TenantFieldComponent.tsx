'use client'

import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField, useField, useFormInitializing, useFormModified } from '@payloadcms/ui'
import { useCallback, useEffect, useRef, useState } from 'react'

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
    selectedTenantSlug,
    setEntityType: setEntityType,
    setModified,
    setTenant,
  } = useTenantSelection()

  const isGlobalCollection = !!unique
  const hasSetValueRef = useRef(false)
  // Cache tenant lookups to avoid repeated API calls
  const [tenantIdBySlug, setTenantIdBySlug] = useState<Record<string, number>>({})
  const [tenantSlugById, setTenantSlugById] = useState<Record<number, string>>({})

  // Track whether form has finished initializing
  const formReady = !formInitializing && !formInitializingContext

  const lookupTenantIdBySlug = useCallback(
    async (slug: string): Promise<number | null> => {
      if (tenantIdBySlug[slug]) {
        return tenantIdBySlug[slug]
      }

      try {
        const response = await fetch(
          `/api/tenants?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`,
          { credentials: 'include' },
        )
        const result = await response.json()
        if (result.docs && result.docs.length > 0) {
          const id = result.docs[0].id
          setTenantIdBySlug((prev) => ({ ...prev, [slug]: id }))
          return id
        }
      } catch (_) {
        // Silent fail - tenant field hook will handle missing tenant
      }
      return null
    },
    [tenantIdBySlug],
  )

  const lookupTenantSlugById = useCallback(
    async (id: number): Promise<string | null> => {
      if (tenantSlugById[id]) {
        return tenantSlugById[id]
      }

      try {
        const response = await fetch(`/api/tenants/${id}?depth=0`, { credentials: 'include' })
        const result = await response.json()
        if (result.slug) {
          setTenantSlugById((prev) => ({ ...prev, [id]: result.slug }))
          return result.slug
        }
      } catch (_) {
        // Silent fail
      }
      return null
    },
    [tenantSlugById],
  )

  useEffect(() => {
    // Don't try to set values while the form is still initializing
    if (!formReady) {
      return
    }

    const syncTenantValue = async () => {
      if (!hasSetValueRef.current && !isGlobalCollection) {
        // Set value on load
        if (value && typeof value === 'number') {
          // Tenant field is already set as the tenant ID - sync provider with document's tenant
          const slug = await lookupTenantSlugById(value)
          if (slug && slug !== selectedTenantSlug) {
            setTenant({ slug, refresh: false })
          }
          hasSetValueRef.current = true
          return
        }

        // Get tenant ID for the selected slug
        const slug = selectedTenantSlug || (options[0]?.value ? options[0].value : null)
        if (slug) {
          setTenant({ slug, refresh: unique })
          const tenantId = await lookupTenantIdBySlug(slug)
          if (tenantId) {
            setValue(tenantId, true)
          }
        }
        hasSetValueRef.current = true
      } else if (selectedTenantSlug) {
        // Update the field on the document value when the tenant is changed
        const tenantId = await lookupTenantIdBySlug(selectedTenantSlug)
        if (tenantId && value !== tenantId) {
          setValue(tenantId, !value || value === tenantId)
        }
      }
    }

    syncTenantValue()
  }, [
    value,
    selectedTenantSlug,
    setTenant,
    setValue,
    options,
    unique,
    isGlobalCollection,
    formReady,
    formInitializing,
    formInitializingContext,
    lookupTenantIdBySlug,
    lookupTenantSlugById,
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
