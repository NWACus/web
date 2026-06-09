import type { FieldHook, Where } from 'payload'

import { APIError } from 'payload'
import invariant from 'tiny-invariant'
import { formatSlug } from './formatSlug'

type EnsureUniqueSlugOptions = {
  // Field to auto-generate the slug from when it's left blank (e.g. 'title').
  generateFromField?: string
  // Date field folded into the auto-generated slug as `-YYYY-MM-DD` (e.g. 'startDate').
  // Lets many same-named events (e.g. "Avalanche Awareness Class") get distinct, meaningful slugs.
  dateField?: string
  // Resolve duplicate slugs by appending `-2`, `-3`, ... instead of throwing an error.
  autoSuffixOnDuplicate?: boolean
}

// Formats a date value as `YYYY-MM-DD` (UTC) for use in a slug; returns '' if not a valid date.
const formatDateForSlug = (value: unknown): string => {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return ''
  }

  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

export const ensureUniqueSlug =
  (options: EnsureUniqueSlugOptions = {}): FieldHook =>
  async (props) => {
    const { data, originalDoc, req, value, collection } = props

    invariant(
      !!collection,
      'Collection config missing in ensureUniqueSlug FieldHook. This is likely a misuse of the slug field.',
    )

    const tenantField = collection.fields.find(
      (field) => 'name' in field && field.name === 'tenant',
    )
    const collectionHasTenantField = !!tenantField
    const tenantFieldRequired =
      tenantField && 'required' in tenantField && tenantField.required === true

    const incomingTenantID = data?.tenant?.id ? data?.tenant.id : data?.tenant
    const currentTenantID = originalDoc?.tenant?.id ? originalDoc.tenant.id : originalDoc?.tenant
    const tenantIDToMatch = incomingTenantID || currentTenantID

    const currentID = data?.id || originalDoc?.id

    // Determine the desired slug: use the entered value, or auto-generate from the
    // configured source field (+ date) when it's been left blank.
    let desiredSlug = typeof value === 'string' ? value : ''
    if (!desiredSlug && options.generateFromField) {
      const source = data?.[options.generateFromField]
      const base = typeof source === 'string' ? formatSlug(source) : ''
      const dateSuffix = options.dateField ? formatDateForSlug(data?.[options.dateField]) : ''
      desiredSlug = [base, dateSuffix].filter(Boolean).join('-')
    }

    // Don't validate if there is no slug yet
    if (!desiredSlug) {
      return value
    }

    const slugExists = async (candidate: string): Promise<boolean> => {
      const conditions: Where[] = [{ slug: { equals: candidate } }]

      if (currentID) {
        conditions.push({ id: { not_in: [currentID] } })
      }

      if (collectionHasTenantField && tenantFieldRequired && tenantIDToMatch) {
        conditions.push({ tenant: { equals: tenantIDToMatch } })
      }

      const res = await req.payload.find({
        collection: collection.slug,
        where: { and: conditions },
        limit: 1,
        depth: 0,
      })

      return res.docs.length > 0
    }

    if (!(await slugExists(desiredSlug))) {
      return desiredSlug
    }

    // Slug collides with an existing document
    if (options.autoSuffixOnDuplicate) {
      let counter = 2
      while (await slugExists(`${desiredSlug}-${counter}`)) {
        counter++
      }
      return `${desiredSlug}-${counter}`
    }

    if (req.user) {
      throw new APIError(
        `A ${collection.labels.singular} with the slug "${desiredSlug}" already exists. Slug must be unique${collectionHasTenantField ? ' per avalanche center' : ''}.`,
        400,
      )
    }

    return desiredSlug
  }
