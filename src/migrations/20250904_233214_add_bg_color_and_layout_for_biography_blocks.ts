import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_biography\` ADD \`background_color\` text DEFAULT 'white';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_biography\` ADD \`image_layout\` text DEFAULT 'left';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_biography\` ADD \`background_color\` text DEFAULT 'white';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_biography\` ADD \`image_layout\` text DEFAULT 'left';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_biography\` ADD \`background_color\` text DEFAULT 'white';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_biography\` ADD \`image_layout\` text DEFAULT 'left';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_biography\` ADD \`background_color\` text DEFAULT 'white';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_biography\` ADD \`image_layout\` text DEFAULT 'left';`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_biography\` DROP COLUMN \`background_color\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_biography\` DROP COLUMN \`image_layout\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_biography\` DROP COLUMN \`background_color\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_biography\` DROP COLUMN \`image_layout\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_biography\` DROP COLUMN \`background_color\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_biography\` DROP COLUMN \`image_layout\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_biography\` DROP COLUMN \`background_color\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_biography\` DROP COLUMN \`image_layout\`;`)
}
