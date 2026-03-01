import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_image_text\` ADD \`text_wrap\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_image_text\` ADD \`text_wrap\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_image_text\` ADD \`text_wrap\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_image_text\` ADD \`text_wrap\` integer DEFAULT false;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_image_text\` DROP COLUMN \`text_wrap\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_image_text\` DROP COLUMN \`text_wrap\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_text\` DROP COLUMN \`text_wrap\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_text\` DROP COLUMN \`text_wrap\`;`)
}
