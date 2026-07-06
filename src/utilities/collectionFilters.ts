import { FilterOptionsProps, Where } from 'payload'
import { getTenantSlugFromCookie } from './tenancy/getTenantFromCookie'

const draftableLinkCollections = new Set(['pages', 'posts'])

type TenantFilterProps = {
  data: FilterOptionsProps['data']
  req: Pick<FilterOptionsProps['req'], 'headers'>
}

type TenantPublishedFilterProps = TenantFilterProps & Pick<FilterOptionsProps, 'relationTo'>
type TenantIdFilterProps = TenantFilterProps & Pick<FilterOptionsProps, 'id'>

const combineFilters = (...filters: Where[]): Where => {
  const activeFilters = filters.filter((filter) => Object.keys(filter).length > 0)

  if (activeFilters.length === 0) return {}
  if (activeFilters.length === 1) return activeFilters[0]

  return {
    and: activeFilters,
  }
}

export const getImageTypeFilter = () => ({
  mimeType: { contains: 'image' },
})

export const getTenantFilter = ({ data, req }: TenantFilterProps): Where => {
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

export const getTenantAndPublishedFilter = (props: TenantPublishedFilterProps): Where => {
  const tenantFilter = getTenantFilter(props)

  if (!draftableLinkCollections.has(props.relationTo)) return tenantFilter

  return combineFilters(tenantFilter, {
    _status: {
      equals: 'published',
    },
  })
}

export const getTenantAndIdFilter = ({ id, data, req }: TenantIdFilterProps): Where => {
  const idFilter = { id: { not_in: [id] } }

  // If the document already has a tenant relationship set, use that
  if (data.tenant) {
    return {
      ...idFilter,
      tenant: {
        equals: data.tenant,
      },
    }
  }

  // Otherwise, filter by tenant slug from cookie
  const tenantSlug = getTenantSlugFromCookie(req.headers)
  if (tenantSlug) {
    return {
      ...idFilter,
      'tenant.slug': {
        equals: tenantSlug,
      },
    }
  }

  return idFilter
}
