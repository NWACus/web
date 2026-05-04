import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

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
 *
 * The intermediate collection document_references tables (sponsors, biographies,
 * teams) are created here because the payload.update() calls below trigger
 * beforeChange hooks that query those tables via the current schema. A later
 * migration (20260424_180242) also creates these tables with IF NOT EXISTS.
 */
export async function up({ payload, db }: MigrateUpArgs): Promise<void> {
  // Pre-create intermediate document_references tables so Payload's hooks
  // can query them during the backfill below
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`sponsors_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`sponsors\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`sponsors_document_references_order_idx\` ON \`sponsors_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`sponsors_document_references_parent_id_idx\` ON \`sponsors_document_references\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`biographies_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`biographies\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`biographies_document_references_order_idx\` ON \`biographies_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`biographies_document_references_parent_id_idx\` ON \`biographies_document_references\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`teams_document_references\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`collection\` text,
  	\`doc_id\` numeric,
  	\`instances\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`teams_document_references_order_idx\` ON \`teams_document_references\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`teams_document_references_parent_id_idx\` ON \`teams_document_references\` (\`_parent_id\`);`,
  )
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
