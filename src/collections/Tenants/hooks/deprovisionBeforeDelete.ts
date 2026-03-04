import type { CollectionBeforeDeleteHook } from 'payload'

// All collections that have a tenant relationship field
const TENANT_SCOPED_COLLECTIONS = [
  'navigations',
  'homePages',
  'builtInPages',
  'settings',
  'pages',
  'posts',
  'events',
  'eventGroups',
  'eventTags',
  'sponsors',
  'tags',
  'teams',
  'biographies',
  'documents',
  'media',
  'redirects',
  'roleAssignments',
] as const

/**
 * Deletes all data scoped to a tenant before the tenant itself is deleted.
 * This prevents foreign key constraint errors from SQLite.
 */
export const deprovisionBeforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { payload } = req
  const log = payload.logger

  log.info(`Cleaning up data for tenant ${id} before deletion...`)

  for (const collection of TENANT_SCOPED_COLLECTIONS) {
    const docs = await payload.find({
      collection,
      where: { tenant: { equals: id } },
      limit: 0,
      depth: 0,
    })

    if (docs.totalDocs > 0) {
      log.info(`Deleting ${docs.totalDocs} ${collection} documents for tenant ${id}`)
      await payload.delete({
        collection,
        where: { tenant: { equals: id } },
        req,
      })
    }
  }

  log.info(`Cleanup complete for tenant ${id}`)
}
