import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

const ROUTABLE_COLLECTIONS = ['pages', 'posts', 'homePages', 'events'] as const

/**
 * Backfill the documentReferences field for all existing routable documents.
 * The populateDocumentReferences beforeChange hook only fires on save, so
 * existing documents need a no-op update to trigger it.
 *
 * If a document has pre-existing invalid data (e.g. a blank required field),
 * the update throws a validation error. Log and skip those documents so the
 * migration doesn't block the entire deploy on one bad record; the skipped
 * doc's documentReferences will populate naturally on its next save.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  for (const collection of ROUTABLE_COLLECTIONS) {
    const docs = await payload.find({
      collection,
      limit: 0,
      depth: 0,
    })

    let succeeded = 0
    let skipped = 0

    for (const doc of docs.docs) {
      try {
        await payload.update({
          collection,
          id: doc.id,
          data: {},
          context: { disableRevalidate: true },
        })
        succeeded++
      } catch (err) {
        skipped++
        payload.logger.warn(
          { err, collection, id: doc.id },
          `Skipping ${collection} id=${doc.id} during documentReferences backfill — existing data fails validation. documentReferences will populate on next save.`,
        )
      }
    }

    payload.logger.info(
      `Backfilled documentReferences for ${succeeded} ${collection} documents (${skipped} skipped)`,
    )
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // No-op — documentReferences will be re-populated on next save
  payload.logger.info('No rollback needed for documentReferences backfill')
}
