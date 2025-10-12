import type { FieldHook, Where } from 'payload'

import { ValidationError } from 'payload'
import invariant from 'tiny-invariant'

export const ensureUniqueSlug: FieldHook = async (props) => {
  const { data, originalDoc, req, value, collection } = props

  invariant(
    !!collection,
    'Collection config missing in ensureUniqueSlug FieldHook. This is likely a misuse of the slug field.',
  )

  // if value is unchanged, skip validation
  if (originalDoc.slug === value) {
    return value
  }

  const collectionHasTenantField = !!collection.fields.find(
    (field) => 'name' in field && field.name === 'tenant',
  )

  const incomingTenantID = typeof data?.tenant === 'object' ? data.tenant.id : data?.tenant
  const currentTenantID =
    typeof originalDoc?.tenant === 'object' ? originalDoc.tenant.id : originalDoc?.tenant
  const tenantIDToMatch = incomingTenantID || currentTenantID

  const conditions: Where[] = [
    {
      slug: {
        equals: value,
      },
    },
  ]

  if (collectionHasTenantField) {
    conditions.push({
      tenant: {
        equals: tenantIDToMatch,
      },
    })
  }

  const duplicateDocumentsRes = await req.payload.find({
    collection: collection.slug,
    where: {
      and: conditions,
    },
  })

  if (duplicateDocumentsRes.docs.length > 0 && req.user) {
    throw new ValidationError({
      errors: [
        {
          message: `A ${collection.labels.singular} with the slug ${value} already exists. Slug must be unique${collectionHasTenantField ? ' per avalanche center' : ''}.`,
          path: 'slug',
        },
      ],
    })
  }

  return value
}
