import type { Payload, UIFieldServerProps } from 'payload'

import { isSharedContentCollection } from '@/constants/sharedContent'
import { collectionLabel } from '@/utilities/collectionLabel'
import { findDocumentsWithReferences } from '@/utilities/findDocumentsWithReferences'
import { hasGlobalRolePermission } from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import type { DocumentReference } from '@/utilities/revalidateDocument'
import { WhereThisIsUsedTable, type WhereUsedRow } from './WhereThisIsUsedTable'

function tenantId(tenant: DocumentReference['tenant']): number {
  return typeof tenant === 'number' ? tenant : tenant.id
}

/**
 * One query for every center named in the list. A populated tenant carries only its id and slug
 * (Tenants sets `defaultPopulate: { slug: true }`), and this panel wants the center's real name.
 */
async function centerNamesById(
  payload: Payload,
  references: DocumentReference[],
): Promise<Record<number, string>> {
  const ids = [...new Set(references.map((ref) => tenantId(ref.tenant)))]
  if (ids.length === 0) return {}

  const { docs } = await payload.find({
    collection: 'tenants',
    where: { id: { in: ids } },
    select: { name: true },
    depth: 0,
    limit: 0,
  })

  return Object.fromEntries(docs.map((tenant) => [tenant.id, tenant.name]))
}

function toRow(
  reference: DocumentReference,
  payload: Payload,
  centerNames: Record<number, string>,
): WhereUsedRow {
  const label = collectionLabel(payload, reference.collection)
  return {
    key: `${reference.collection}:${reference.id}`,
    centerName: centerNames[tenantId(reference.tenant)] ?? 'Unknown center',
    collectionLabel: label,
    // A tenant-scoped global such as HomePage has neither a title nor a slug; its own label reads
    // better in a table already scoped to one center than a bare ID does.
    title: reference.title || reference.slug || label,
    isDraft: reference.status === 'draft',
    href: `${payload.config.routes.admin}/collections/${reference.collection}/${reference.id}`,
  }
}

/**
 * Lists every document that uses this Shared Content document, so an editor can see what a change
 * would affect before making it. Drafts are included: an unpublished page that uses the photo is
 * exactly what the editor needs to know about.
 *
 * Shown only to people who can edit the shared document: it lists every center's documents,
 * drafts included, without checking whether the viewer could read each one.
 *
 * One hop is enough today, because Pages, HomePages and Posts reference shared photos directly.
 */
export const WhereThisIsUsed = async ({
  id,
  collectionSlug,
  payload,
  user,
}: UIFieldServerProps) => {
  if (typeof id !== 'number') return null
  if (!isSharedContentCollection(collectionSlug)) return null
  if (!hasGlobalRolePermission({ method: 'update', collection: collectionSlug, user })) return null

  const references = await findDocumentsWithReferences(
    { collection: collectionSlug, id },
    { includeDrafts: true },
  )
  const centerNames = await centerNamesById(payload, references)

  return (
    <WhereThisIsUsedTable
      rows={references.map((reference) => toRow(reference, payload, centerNames))}
    />
  )
}
