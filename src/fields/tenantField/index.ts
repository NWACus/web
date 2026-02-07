import { getTenantFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
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
      ({ req, value }) => {
        if (!value) {
          const tenantFromCookie = getTenantFromCookie(req.headers, 'number')
          if (tenantFromCookie) {
            return tenantFromCookie
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
