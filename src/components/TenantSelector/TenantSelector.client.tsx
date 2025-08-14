'use client'
import type { ReactSelectOption } from '@payloadcms/ui'

import { SelectInput, useConfig } from '@payloadcms/ui'
import React from 'react'

import { useViewType } from '@/providers/ViewTypeProvider'
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client'
import { useParams } from 'next/navigation'
import './index.scss'

const TenantSelectorClient = ({ label }: { label: string }) => {
  const { config } = useConfig()
  const params = useParams()
  const { options, selectedTenantID, setTenant } = useTenantSelection()
  const viewType = useViewType()

  const isGlobal = params.segments && params.segments[0] === 'globals'
  const isCollection = params.segments && params.segments[0] === 'collections'
  const slugFromParams = params.segments && params.segments[1]
  const isUnique = config.collections
    .find((collectionConfig) => collectionConfig.slug === slugFromParams)
    // @ts-expect-error not picking up FieldBaseClient types
    ?.fields.find((fieldConfig) => fieldConfig.name === 'tenant')?.unique

  let isReadOnly = false

  const handleChange = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[]) => {
      if (option && 'value' in option) {
        setTenant({ id: option.value as string, refresh: true })
      } else {
        setTenant({ id: undefined, refresh: true })
      }
    },
    [setTenant],
  )

  // hide for Global RoleRoles, NAC widget & Diagnostics
  if (
    isGlobal ||
    params?.segments?.includes('roles') ||
    params?.segments?.includes('globalRoles') ||
    params?.segments?.includes('globalRoleAssignments')
  )
    return null

  if (options.length <= 1) {
    return null
  }

  if (isCollection && viewType === 'document' && !isUnique) isReadOnly = true

  return (
    <div className="tenant-selector">
      <SelectInput
        isClearable={viewType !== 'document'}
        label={label}
        name="setTenant"
        onChange={handleChange}
        options={options}
        path="setTenant"
        readOnly={isReadOnly}
        value={selectedTenantID as string | undefined}
      />
    </div>
  )
}

export default TenantSelectorClient
