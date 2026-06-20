/**
 * Verifies that the database schema matches what the compiled code expects.
 *
 * Turso/libSQL can report a successful `payload migrate` while leaving the
 * schema incomplete — it does not honor `PRAGMA foreign_keys=OFF` inside a
 * transaction, which the generated table-recreation migrations rely on. The
 * missing tables only surface later as an opaque "no such table: ..." error
 * during the Vercel build's static page-data collection.
 *
 * This script reproduces that data-collection query for the block-heavy
 * collections (a `find` selects every block subtable to reconstruct the
 * document), so a missing table fails fast here with a clear message instead
 * of deep inside the build. See docs/migration-safety.md.
 */
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config: configPromise })

let failed = false

// Probe every collection: a `find` selects all of a collection's block/array
// subtables to reconstruct its documents, so a single missing table surfaces
// here instead of deep inside the Vercel build.
for (const collection of payload.config.collections) {
  try {
    await payload.find({ collection: collection.slug, limit: 1, depth: 0, pagination: false })
    payload.logger.info(`✓ schema OK for "${collection.slug}"`)
  } catch (err) {
    failed = true
    const message = err instanceof Error ? err.message : String(err)
    payload.logger.error(`✗ schema check failed for "${collection.slug}": ${message}`)
  }
}

if (failed) {
  payload.logger.error(
    'Schema verification failed: the database is missing tables the code expects. ' +
      'This is the known Turso migration-application issue (see docs/migration-safety.md). ' +
      'Re-running migrations on a freshly provisioned database typically resolves it.',
  )
  process.exit(1)
}

payload.logger.info('Schema verification passed.')
process.exit(0)
