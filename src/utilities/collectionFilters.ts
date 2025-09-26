import { FilterOptionsProps } from 'payload'
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
