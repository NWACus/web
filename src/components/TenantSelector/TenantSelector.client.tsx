'use client'

import { SelectInput, useConfig, type ReactSelectOption } from '@payloadcms/ui'
import { useCallback } from 'react'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import { useViewType } from '@/providers/ViewTypeProvider'
import { useParams } from 'next/navigation'
import './index.scss'

const TenantSelectorClient = ({ label }: { label: string }) => {
  const { config } = useConfig()
  const params = useParams()
  const { options, selectedTenantID, setTenant } = useTenantSelection()

  const isGlobal = params.segments && params.segments[0] === 'globals'
  const isCollection = params.segments && params.segments[0] === 'collections'
  const slugFromParams = params.segments && params.segments[1]

  const viewType = useViewType()
  const isDashboardView = viewType === 'dashboard'
  const isDocumentView = viewType === 'document'

  const collectionConfig = config.collections.find(
    (collectionConfig) => collectionConfig.slug === slugFromParams,
  )
  const collectionTenantFieldConfig = collectionConfig?.fields.find(
    (fieldConfig) => 'name' in fieldConfig && fieldConfig.name === 'tenant',
  )
  const isUnique = !!collectionTenantFieldConfig?.unique

  let isReadOnly = false

  const handleChange = useCallback(
    (option: ReactSelectOption | ReactSelectOption[]) => {
      if (option && 'value' in option) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        setTenant({ id: option.value as string, refresh: true })
      } else {
        setTenant({ id: undefined, refresh: true })
      }
    },
    [setTenant],
  )

  // Hide for non-tenant scoped collections
  // Courses, Diagnostics, NAC widget, Global Role, Providers, Roles, & Users
  if (isGlobal || (!collectionTenantFieldConfig && !isDashboardView)) return null

  if (options.length <= 1) {
    return null
  }

  if (isCollection && isDocumentView && !isUnique) isReadOnly = true

  return (
    <div className="tenant-selector">
      <SelectInput
        isClearable={!isDocumentView}
        label={label}
        name="setTenant"
        onChange={handleChange}
        options={options}
        path="setTenant"
        readOnly={isReadOnly}
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        value={selectedTenantID as string | undefined}
      />
    </div>
  )
}

export default TenantSelectorClient
