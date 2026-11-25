'use client'

import { columnCount, layoutOptions } from '@/components/ColumnLayoutPicker/layouts'
import { useField, useForm, useFormFields } from '@payloadcms/ui'
import { UIFieldClientComponent } from 'payload'
import { useEffect, useRef } from 'react'

export const DefaultColumnAdder: UIFieldClientComponent = ({ schemaPath, path, field }) => {
  const { addFieldRow, dispatchFields, setModified, disabled } = useForm()
  const hasAddedRowRef = useRef<boolean>(false)

  const parentPath = path.split(`.${field.name}`)[0]
  const columnsPath = `${parentPath}.columns`
  const layoutPath = `${parentPath}.layout`

  const parentSchemaPath = schemaPath?.split(`.${field.name}`)[0]
  const columnsSchemaPath = `${parentSchemaPath}.columns`

  const { value: numColumns } = useField<number>({ path: columnsPath })
  const layout = useFormFields(([fields]) => fields[layoutPath]?.value)

  useEffect(
    function addDefaultColumnIfNoneExist() {
      if (numColumns === 0 && !hasAddedRowRef.current) {
        addFieldRow({ path: columnsPath, schemaPath: columnsSchemaPath || '' })
        hasAddedRowRef.current = true
      }
    },
    [addFieldRow, columnsPath, columnsSchemaPath, numColumns],
  )

  // Lives here, not in the layout picker: Payload doesn't mount fields inside a closed Layout group
  useEffect(
    function matchLayoutToColumnCount() {
      if (disabled || !numColumns) return
      if (typeof layout === 'string' && columnCount(layout) === numColumns) return

      const validOption = layoutOptions.find((opt) => columnCount(opt.value) === numColumns)
      if (!validOption) return

      dispatchFields({
        type: 'UPDATE',
        path: layoutPath,
        value: validOption.value,
        valid: true,
        errorMessage: undefined,
      })
      setModified(true)
    },
    [disabled, dispatchFields, layout, layoutPath, numColumns, setModified],
  )

  return null
}
