import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` ADD \`sponsors_layout\` text DEFAULT 'static';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` DROP COLUMN \`title\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` ADD \`sponsors_layout\` text DEFAULT 'static';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` DROP COLUMN \`title\`;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_sponsors_block\` ADD \`sponsors_layout\` text DEFAULT 'static';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_sponsors_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_sponsors_block\` DROP COLUMN \`title\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` ADD \`sponsors_layout\` text DEFAULT 'static';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` DROP COLUMN \`title\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` ADD \`title\` text;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` DROP COLUMN \`sponsors_layout\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` ADD \`title\` text;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` DROP COLUMN \`sponsors_layout\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_sponsors_block\` ADD \`title\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_sponsors_block\` DROP COLUMN \`sponsors_layout\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_sponsors_block\` DROP COLUMN \`wrap_in_container\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` ADD \`title\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` DROP COLUMN \`sponsors_layout\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
}
