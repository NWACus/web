import { getTenantFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { APIError, Condition, RelationshipField } from 'payload'

export const tenantField = ({
  access,
  unique = false,
  showInputInDocumentView = false,
  required = true,
  condition,
}: {
  access?: RelationshipField['access']
  unique?: boolean
  showInputInDocumentView?: boolean
  required?: boolean
  condition?: Condition
} = {}): RelationshipField => ({
  name: 'tenant',
  type: 'relationship',
  access,
  admin: {
    allowCreate: false,
    allowEdit: false,
    condition,
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
          // Only throw error if field is required
          if (required) {
            throw new APIError('You must select a tenant', 400, null, true)
          }
          // Field is not required, allow undefined/null
          return value
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
