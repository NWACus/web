'use client'
import { RelationshipField, useField } from '@payloadcms/ui'
import React from 'react'

type Props = {
  initialValue?: number
  field: React.ComponentProps<typeof RelationshipField>['field']
  path: React.ComponentProps<typeof RelationshipField>['path']
  readOnly: React.ComponentProps<typeof RelationshipField>['readOnly']
}
export function TenantFieldComponentClient({ initialValue, path, field, readOnly }: Props) {
  const { formInitializing, setValue, value } = useField({ path })
  const hasSetInitialValue = React.useRef(false)

  React.useEffect(() => {
    if (!hasSetInitialValue.current && !formInitializing && initialValue && !value) {
      console.log(`setting initial value`)
      setValue(initialValue)
      hasSetInitialValue.current = true
    }
  }, [initialValue, setValue, formInitializing, value])

  return <RelationshipField field={field} path={path} readOnly={readOnly} />
}
