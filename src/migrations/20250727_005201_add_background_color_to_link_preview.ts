import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_link_preview\` ADD \`background_color\` text DEFAULT 'white';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_link_preview\` ADD \`background_color\` text DEFAULT 'white';`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_link_preview\` DROP COLUMN \`background_color\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_link_preview\` DROP COLUMN \`background_color\`;`)
}
