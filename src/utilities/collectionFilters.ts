import { FilterOptionsProps, Where } from 'payload'
import { getTenantSlugFromCookie } from './tenancy/getTenantFromCookie'

export const getImageTypeFilter = () => ({
  mimeType: { contains: 'image' },
})

export const getTenantFilter = ({ data, req }: FilterOptionsProps): Where => {
  // If the document already has a tenant relationship set, use that
  if (data.tenant) {
    return {
      tenant: {
        equals: data.tenant,
      },
    }
  }

  // Otherwise, filter by tenant slug from cookie
  const tenantSlug = getTenantSlugFromCookie(req.headers)
  if (tenantSlug) {
    return {
      'tenant.slug': {
        equals: tenantSlug,
      },
    }
  }

  return {}
}

export const getTenantAndIdFilter = ({ id, data }: FilterOptionsProps) => ({
  id: {
    not_in: [id],
  },
  tenant: {
    equals: data.tenant,
  },
})
