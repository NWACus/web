import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

const ROUTABLE_COLLECTIONS = ['pages', 'posts', 'homePages', 'events'] as const

/**
 * Backfill the documentReferences field for all existing routable documents.
 * The populateDocumentReferences beforeChange hook only fires on save, so
 * existing documents need a no-op update to trigger it.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  for (const collection of ROUTABLE_COLLECTIONS) {
    const docs = await payload.find({
      collection,
      limit: 0,
      depth: 0,
    })

    for (const doc of docs.docs) {
      await payload.update({
        collection,
        id: doc.id,
        data: {},
        context: { disableRevalidate: true },
      })
    }

    payload.logger.info(
      `Backfilled documentReferences for ${docs.docs.length} ${collection} documents`,
    )
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // No-op — documentReferences will be re-populated on next save
  payload.logger.info('No rollback needed for documentReferences backfill')
}
