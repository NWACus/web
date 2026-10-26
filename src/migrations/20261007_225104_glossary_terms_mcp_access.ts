import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`glossary_terms_find\` integer DEFAULT false;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`glossary_terms_find\`;`)
}
