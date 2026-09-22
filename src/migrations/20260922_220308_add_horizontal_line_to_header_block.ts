import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_header_block\` ADD \`horizontal_line\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` ADD \`horizontal_line\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_header_block\` ADD \`horizontal_line\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_header_block\` ADD \`horizontal_line\` integer DEFAULT false;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_header_block\` DROP COLUMN \`horizontal_line\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` DROP COLUMN \`horizontal_line\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_header_block\` DROP COLUMN \`horizontal_line\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_header_block\` DROP COLUMN \`horizontal_line\`;`)
}
