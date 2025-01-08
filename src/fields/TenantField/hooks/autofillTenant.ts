import type { FieldHook } from 'payload'
import { defaultTenantIdFromHeaders } from '@/utilities/tenancy/defaultTenantIdFromHeaders'

export const autofillTenant: FieldHook = async ({ req: {headers, payload}, value, operation }) => {
  const defaultTenantId = await defaultTenantIdFromHeaders(headers, payload)

  if (typeof value !== 'number' && defaultTenantId !== undefined) {
    return defaultTenantId
  }

  return value
}
