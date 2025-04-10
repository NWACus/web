'use client'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { ViewTypes } from 'payload'

import { SelectInput } from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client'
import './index.scss'

const TenantSelector: React.FC<{ label: string; viewType?: ViewTypes }> = ({
  label,
  viewType,
}: {
  label: string
  viewType?: ViewTypes
}) => {
  const { options, selectedTenantID, setTenant } = useTenantSelection()

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

export default TenantSelector
