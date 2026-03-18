import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { APIError, RelationshipField } from 'payload'

export const tenantField = ({
  access,
  unique = false,
  debug = false,
}: {
  access?: RelationshipField['access']
  unique?: boolean
  debug?: boolean
} = {}): RelationshipField => ({
  name: 'tenant',
  type: 'relationship',
  access,
  admin: {
    allowCreate: false,
    allowEdit: false,
    components: {
      Field: {
        clientProps: {
          debug,
          unique,
        },
        path: '@/fields/tenantField/TenantFieldComponent#TenantFieldComponent',
      },
    },
  },
  hasMany: false,
  maxDepth: 3,
  hooks: {
    beforeChange: [
      async ({ req, value }) => {
        if (!value) {
          const tenantSlug = getTenantSlugFromCookie(req.headers)
          if (tenantSlug) {
            // Look up tenant ID by slug
            const { docs } = await req.payload.find({
              collection: 'tenants',
              where: { slug: { equals: tenantSlug } },
              limit: 1,
              depth: 0,
              req,
            })
            if (docs[0]) {
              return docs[0].id
            }
          }
          throw new APIError('You must select a tenant', 400, null, true)
        }

        return value
      },
    ],
  },
  index: true,
  label: 'Avalanche Center',
  relationTo: 'tenants',
  unique,
  required: true,
})
