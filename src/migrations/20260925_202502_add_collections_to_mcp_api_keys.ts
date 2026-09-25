import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`courses_find\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`providers_find\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`built_in_pages_find\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`galleries_find\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`announcements_find\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`station_pages_find\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`redirects_find\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`shared_media_find\` integer DEFAULT false;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`courses_find\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`providers_find\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`built_in_pages_find\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`galleries_find\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`announcements_find\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`station_pages_find\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`redirects_find\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`shared_media_find\`;`)
}
