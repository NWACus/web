import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

const COLLECTIONS = [
  'pages',
  'posts',
  'homePages',
  'events',
  'sponsors',
  'biographies',
  'teams',
] as const

/**
 * Backfill documentReferences for existing documents. The populateDocumentReferences
 * beforeChange hook only fires on save, so each existing doc needs a no-op update.
 * Docs with pre-existing invalid data are logged and skipped so one bad record can't
 * block the deploy; their references populate on next save.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  for (const collection of COLLECTIONS) {
    let docs
    try {
      docs = await payload.find({
        collection,
        limit: 0,
        depth: 0,
      })
    } catch (err) {
      // On a fresh DB this find can reference a block table a later migration hasn't
      // created yet (the Local API queries the current schema). There's nothing to
      // backfill on an empty DB, so skip — documentReferences populates on next save.
      payload.logger.warn(
        { err, collection },
        `Skipping documentReferences backfill for ${collection} — find failed (likely a fresh database missing block tables added by a later migration).`,
      )
      continue
    }

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
