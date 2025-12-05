import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_event_table\` ADD \`background_color\` text DEFAULT 'transparent';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_event_table\` ADD \`background_color\` text DEFAULT 'transparent';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_event_table\` ADD \`background_color\` text DEFAULT 'transparent';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_event_table\` ADD \`background_color\` text DEFAULT 'transparent';`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_event_table\` DROP COLUMN \`background_color\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_event_table\` DROP COLUMN \`background_color\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_event_table\` DROP COLUMN \`background_color\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_event_table\` DROP COLUMN \`background_color\`;`)
}
