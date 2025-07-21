'use client'
import type { ReactSelectOption } from '@payloadcms/ui'

import { SelectInput } from '@payloadcms/ui'
import React from 'react'

import { useViewType } from '@/providers/ViewTypeProvider'
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client'
import './index.scss'

const TenantSelectorClient = ({ label }: { label: string }) => {
  const { options, selectedTenantID, setTenant } = useTenantSelection()
  const viewType = useViewType()

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

  if (options.length <= 1) {
    return null
  }

  return (
    <div className="tenant-selector">
      <SelectInput
        isClearable={viewType !== 'document'}
        label={label}
        name="setTenant"
        onChange={handleChange}
        options={options}
        path="setTenant"
        value={selectedTenantID as string | undefined}
      />
    </div>
  )
}

export default TenantSelectorClient
