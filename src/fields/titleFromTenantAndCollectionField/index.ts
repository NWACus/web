import pluralize from 'pluralize'
const { singular } = pluralize
import { TextField, toWords, getPayload } from 'payload'
import configPromise from '@payload-config'

export const titleFromTenantAndCollectionField: TextField = {
  type: 'text',
  name: 'titleFromTenantAndCollection',
  admin: {
    disableListColumn: true,
    components: {
      Field:
        '@/fields/titleFromTenantAndCollectionField/FieldComponent#TitleFromTenantAndCollectionField',
    },
  },
  hooks: {
    beforeChange: [
      async ({ collection, data }) => {
        if (!collection?.slug) return ''

        let title = toWords(singular(collection.slug))

        if (data?.tenant) {
          if (typeof data.tenant === 'number') {
            const payload = await getPayload({ config: configPromise })
            const tenant = await payload.findByID({
              collection: 'tenants',
              id: data.tenant,
              depth: 2,
            })
            title = `${tenant.name} ${title}`
          }
          if (data.tenant.name) {
            title = `${data.tenant.name} ${title}`
          }
        }

        return title
      },
    ],
  },
}
