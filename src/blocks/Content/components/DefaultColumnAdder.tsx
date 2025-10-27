'use client'

import { useField, useForm } from '@payloadcms/ui'
import { UIFieldClientComponent } from 'payload'
import { useEffect, useRef } from 'react'

export const DefaultColumnAdder: UIFieldClientComponent = ({ schemaPath, path, field }) => {
  const { addFieldRow } = useForm()
  const hasAddedRowRef = useRef<boolean>(false)

  const parentPath = path.split(`.${field.name}`)[0]
  const columnsPath = `${parentPath}.columns`

  const parentSchemaPath = schemaPath?.split(`.${field.name}`)[0]
  const columnsSchemaPath = `${parentSchemaPath}.columns`

  const { value: numColumns } = useField<number>({ path: columnsPath })

  useEffect(
    function addDefaultColumnIfNoneExist() {
      if (numColumns === 0 && !hasAddedRowRef.current) {
        addFieldRow({ path: columnsPath, schemaPath: columnsSchemaPath || '' })
        hasAddedRowRef.current = true
      }
    },
    [addFieldRow, columnsPath, columnsSchemaPath, numColumns],
  )

  return null
}
