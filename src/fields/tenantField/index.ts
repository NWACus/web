import { getTenantFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { APIError, RelationshipField } from 'payload'

export const tenantField = ({
  access,
  unique = false,
  showInputInDocumentView = false,
  required = true,
}: {
  access?: RelationshipField['access']
  unique?: boolean
  showInputInDocumentView?: boolean
  required?: boolean
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
          showInputInDocumentView,
          unique,
          required,
        },
        path: '@/fields/tenantField/TenantFieldComponent#TenantFieldComponent',
      },
    },
    position: 'sidebar',
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
  required,
})
