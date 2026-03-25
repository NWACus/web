'use client'

import { useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'
import { useEffect } from 'react'

import { AVALANCHE_CENTERS, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'

/**
 * Invisible component that syncs the name field with the selected slug
 * for new documents. Each time the slug dropdown changes, the name updates.
 */
export const AutoFillNameFromSlug = () => {
  const { id } = useDocumentInfo()
  const slugField = useFormFields(([fields]) => fields.slug)
  const { setValue: setName } = useField<string>({ path: 'name' })

  useEffect(() => {
    if (id) return

    const slugValue = typeof slugField?.value === 'string' ? slugField.value : null
    if (slugValue && isValidTenantSlug(slugValue)) {
      setName(AVALANCHE_CENTERS[slugValue].name)
    }
  }, [id, slugField?.value, setName])

  return null
}
