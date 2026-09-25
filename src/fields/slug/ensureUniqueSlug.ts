import type { CollectionSlug, FieldHook, Where } from 'payload'

import { APIError } from 'payload'
import invariant from 'tiny-invariant'
import { composeSlug, formatDateForSlug, formatSlug, relationshipID, slugOf } from './formatSlug'

export type SlugPrefixFrom = {
  // Relationship field on this collection (e.g. 'provider').
  field: string
  // Collection that relationship points to; its document's slug becomes the prefix.
  collection: CollectionSlug
}

type EnsureUniqueSlugOptions = {
  // Field to auto-generate the slug from when it's left blank (e.g. 'title').
  generateFromField?: string
  // Date field folded into the auto-generated slug as `-YYYY-MM-DD` (e.g. 'startDate').
  // Lets many same-named events (e.g. "Avalanche Awareness Class") get distinct, meaningful slugs.
  dateField?: string
  // Prefix the auto-generated slug with a related document's slug (e.g. a course's provider).
  prefixFrom?: SlugPrefixFrom
  // Resolve duplicate slugs by appending `-2`, `-3`, ... instead of throwing an error.
  autoSuffixOnDuplicate?: boolean
}

type SlugHookArgs = Parameters<FieldHook>[0]

const resolvePrefixSlug = async (
  prefixFrom: SlugPrefixFrom,
  { data, originalDoc, req }: SlugHookArgs,
): Promise<string> => {
  const id = relationshipID(data?.[prefixFrom.field] ?? originalDoc?.[prefixFrom.field])
  if (id === undefined) {
    return ''
  }

  // disableErrors: a missing related doc returns null instead of throwing and killing the save's transaction
  const related = await req.payload.findByID({
    collection: prefixFrom.collection,
    id,
    depth: 0,
    disableErrors: true,
    req,
  })

  return slugOf(related)
}

// Builds a slug for a blank field from the source field (+ prefix, + date).
const generateSlug = async (
  { generateFromField, prefixFrom, dateField }: EnsureUniqueSlugOptions,
  args: SlugHookArgs,
): Promise<string> => {
  const source = generateFromField ? args.data?.[generateFromField] : undefined
  const base = typeof source === 'string' ? formatSlug(source) : ''
  if (!base) {
    return ''
  }

  const prefix = prefixFrom ? await resolvePrefixSlug(prefixFrom, args) : ''
  const date = dateField ? formatDateForSlug(args.data?.[dateField]) : ''
  return composeSlug({ prefix, base, date })
}

export const ensureUniqueSlug =
  (options: EnsureUniqueSlugOptions = {}): FieldHook =>
  // Pre-existing complexity (tenant scoping + collision handling); lower than on main after generateSlug was extracted
  // fallow-ignore-next-line complexity
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

    // Use the entered value, or auto-generate one when it's been left blank.
    const desiredSlug =
      typeof value === 'string' && value ? value : await generateSlug(options, props)

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
