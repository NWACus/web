import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Migration for Payload 3.58.0 -> 3.61.0 upgrade
 *
 * This migration only renames two indexes to match Payload 3.61.0's expectations.
 * The original auto-generated migration recreated all relationship tables, which would
 * cause data loss in production due to Turso/libSQL not respecting PRAGMA foreign_keys=OFF
 * inside transactions.
 *
 * See docs/migration-safety.md for reference.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Drop old indexes with _idx suffix
  await db.run(sql`DROP INDEX IF EXISTS \`roles_texts_order_parent_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`global_roles_texts_order_parent_idx\`;`)

  // Create new indexes without _idx suffix to match Payload 3.61.0 naming convention
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`roles_texts_order_parent\` ON \`roles_texts\` (\`order\`,\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`global_roles_texts_order_parent\` ON \`global_roles_texts\` (\`order\`,\`parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Revert to old index names with _idx suffix
  await db.run(sql`DROP INDEX IF EXISTS \`roles_texts_order_parent\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`global_roles_texts_order_parent\`;`)

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`roles_texts_order_parent_idx\` ON \`roles_texts\` (\`order\`,\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`global_roles_texts_order_parent_idx\` ON \`global_roles_texts\` (\`order\`,\`parent_id\`);`,
  )
}
