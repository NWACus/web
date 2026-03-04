import { provision } from '@/collections/Tenants/endpoints/provisionTenant'
import type { CollectionAfterChangeHook } from 'payload'

export const provisionAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  context,
  req,
}) => {
  if (operation !== 'create') return doc
  if (context.skipProvision) return doc

  req.payload.logger.info(`Auto-provisioning new tenant: ${doc.name} (${doc.slug})`)
  await provision(req.payload, doc)

  return doc
}
