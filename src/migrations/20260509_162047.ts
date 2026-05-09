import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_document_block\` ADD \`layout\` text DEFAULT 'download';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` ADD \`layout\` text DEFAULT 'download';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_document_block\` ADD \`layout\` text DEFAULT 'download';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_block\` ADD \`layout\` text DEFAULT 'download';`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_document_block\` DROP COLUMN \`layout\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` DROP COLUMN \`layout\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_document_block\` DROP COLUMN \`layout\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_block\` DROP COLUMN \`layout\`;`)
}
