import React from 'react'

import { RelationshipFieldServerComponent } from 'payload'

import { TenantFieldComponentClient } from './Field.client'
import { defaultTenantIdFromHeaders } from '@/utilities/tenancy/defaultTenantIdFromHeaders'

export const TenantFieldComponent: RelationshipFieldServerComponent = async ({
  req: { headers },
  payload,
  path,
  field,
  clientField,
  readOnly,
}) => {
  const fieldPath = (path || field?.name || '') as string
  const defaultTenantId = await defaultTenantIdFromHeaders(headers, payload)

  return (
    <TenantFieldComponentClient
      initialValue={defaultTenantId ? defaultTenantId : undefined}
      field={clientField}
      path={fieldPath}
      readOnly={readOnly === undefined ? false : readOnly}
    />
  )
}
