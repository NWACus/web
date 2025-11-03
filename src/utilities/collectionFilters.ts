import { FilterOptionsProps, Where } from 'payload'
import { getTenantIdFromCookie } from './tenancy/getTenantIdFromCookie'

export const getImageTypeFilter = () => ({
  mimeType: { contains: 'image' },
})

export const getTenantFilter = ({ data, req }: FilterOptionsProps) => {
  let tenantId = data.tenant

  if (!tenantId) {
    tenantId = getTenantIdFromCookie(req.headers)
  }

  return {
    tenant: {
      equals: tenantId,
    },
  }
}

export const getTenantAndIdFilter = ({ id, data }: FilterOptionsProps) => ({
  id: {
    not_in: [id],
  },
  tenant: {
    equals: data.tenant,
  },
})

/**
 * Filter events for relationship fields in blocks
 * - If the parent document has a tenant, filter events by that tenant only
 * - If the parent document has no tenant (null/empty), don't filter by tenant (show all events based on user access)
 * - If the current document is an event, exclude it from the results
 */
export const getOptionalTenantAndIdFilter = ({ id, data }: FilterOptionsProps) => {
  const conditions: Where[] = []

  // Exclude current document if id is passed
  if (id) {
    conditions.push({
      id: {
        not_equals: id,
      },
    })
  }

  // If parent document has a tenant, filter events by that tenant only
  if (data?.tenant) {
    conditions.push({
      tenant: {
        equals: data.tenant,
      },
    })
  }

  return conditions.length > 0 ? { and: conditions } : true
}
