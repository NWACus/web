import { Tenant } from '@/payload-types'

// used to assert an unknown value is a number | Tenant
export const isTenantValue = (value: unknown): value is number | Tenant => {
  return (
    typeof value === 'number' ||
    (typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'slug' in value && // included by Tenants collection's defaultPopulate
      'customDomain' in value) // included by Tenants collection's defaultPopulate
  )
}
