import type { FieldHook } from 'payload'
import { defaultTenantIdFromHeaders } from '@/utilities/tenancy/defaultTenantIdFromHeaders'

export const autofillTenant: FieldHook = async ({ req: {headers, payload}, value, operation }) => {
  const defaultTenantId = await defaultTenantIdFromHeaders(headers, payload)

  payload.logger.info(`autofillTenant: value: ${value}, defaultTenantId: ${defaultTenantId}, operation: ${operation}`)

  if (typeof value !== 'number' && defaultTenantId !== undefined) {
    payload.logger.info(`autofillTenant: defaulting to ${defaultTenantId}`)
    return defaultTenantId
  }

  return value
}
