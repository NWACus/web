'use client'

import type { ArrayFieldClientProps } from 'payload'

import {
  type ReactSelectOption,
  RenderFields,
  SelectInput,
  useField,
  useForm,
} from '@payloadcms/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'

export const AvyContentField = (props: ArrayFieldClientProps) => {
  const { field, path: pathFromProps, permissions, schemaPath, indexPath } = props

  const path = pathFromProps ?? field.name
  const { rows } = useField<unknown[]>({ hasRows: true, path })
  const { addFieldRow, getDataByPath } = useForm()
  const { options: tenantOptions, selectedTenantID } = useTenantSelection()

  const [selectedTenantValue, setSelectedTenantValue] = useState<string | number | undefined>(
    undefined,
  )

  // Build a map from tenant ID to array row index
  const tenantRowMap = useMemo(() => {
    const map = new Map<string | number, number>()
    if (!rows) return map
    rows.forEach((_, rowIndex) => {
      const rowData = getDataByPath(`${path}.${String(rowIndex)}`)
      if (rowData && typeof rowData === 'object' && 'tenant' in rowData) {
        const tenantValue = rowData.tenant
        if (typeof tenantValue === 'number' || typeof tenantValue === 'string') {
          map.set(tenantValue, rowIndex)
        }
      }
    })
    return map
  }, [rows, getDataByPath, path])

  // Auto-select tenant from the admin tenant selector if none chosen yet
  useEffect(() => {
    if (selectedTenantValue === undefined && selectedTenantID !== undefined) {
      setSelectedTenantValue(selectedTenantID)
    }
  }, [selectedTenantValue, selectedTenantID])

  const handleTenantChange = useCallback((option: ReactSelectOption | ReactSelectOption[]) => {
    if (option && 'value' in option) {
      setSelectedTenantValue(option.value ? Number(option.value) : undefined)
    } else {
      setSelectedTenantValue(undefined)
    }
  }, [])

  const selectedRowIndex =
    selectedTenantValue !== undefined ? tenantRowMap.get(selectedTenantValue) : undefined

  // Auto-create a row when a tenant is selected but no row exists yet
  useEffect(() => {
    if (selectedTenantValue === undefined) return
    if (tenantRowMap.has(selectedTenantValue)) return
    addFieldRow({
      path,
      schemaPath: schemaPath ?? field.name,
      rowIndex: rows?.length ?? 0,
      subFieldState: {
        tenant: { initialValue: selectedTenantValue, valid: true, value: selectedTenantValue },
      },
    })
  }, [selectedTenantValue, tenantRowMap, addFieldRow, path, schemaPath, field.name, rows?.length])

  const showDropdown = tenantOptions.length > 1

  return (
    <div>
      {showDropdown && (
        <SelectInput
          className="mb-6"
          isClearable
          label="Avalanche Center"
          name="avyContentTenantSelect"
          onChange={handleTenantChange}
          options={tenantOptions}
          path="avyContentTenantSelect"
          value={selectedTenantValue !== undefined ? String(selectedTenantValue) : undefined}
        />
      )}

      {selectedRowIndex !== undefined && (
        <RenderFields
          fields={field.fields.filter((f) => 'name' in f && f.name === 'layout')}
          parentIndexPath={
            indexPath ? `${indexPath}.${String(selectedRowIndex)}` : String(selectedRowIndex)
          }
          parentPath={`${path}.${String(selectedRowIndex)}`}
          parentSchemaPath={schemaPath ?? field.name}
          permissions={permissions ?? {}}
          readOnly={false}
        />
      )}
    </div>
  )
}
