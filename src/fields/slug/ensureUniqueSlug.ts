import type { FieldHook, Where } from 'payload'

import { ValidationError } from 'payload'
import invariant from 'tiny-invariant'

export const ensureUniqueSlug: FieldHook = async (props) => {
  const { data, originalDoc, req, value, collection } = props

  invariant(
    !!collection,
    'Collection config missing in ensureUniqueSlug FieldHook. This is likely a misuse of the slug field.',
  )

  const tenantField = collection.fields.find((field) => 'name' in field && field.name === 'tenant')
  const collectionHasTenantField = !!tenantField
  const tenantFieldRequired =
    tenantField && 'required' in tenantField && tenantField.required === true

  const incomingTenantID = data?.tenant?.id ? data?.tenant.id : data?.tenant
  const currentTenantID = originalDoc?.tenant?.id ? originalDoc.tenant.id : originalDoc?.tenant
  const tenantIDToMatch = incomingTenantID || currentTenantID

  // Don't validate if slug hasn't been generated yet
  if (!value) {
    return value
  }

  const conditions: Where[] = [
    {
      slug: {
        equals: value,
      },
    },
  ]

  if (data?.id || originalDoc.id) {
    conditions.push({
      id: {
        not_in: [data?.id || originalDoc.id],
      },
    })
  }

  if (collectionHasTenantField && tenantFieldRequired && tenantIDToMatch) {
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
