import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_generic_embed\` DROP COLUMN \`embed_height\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_generic_embed\` DROP COLUMN \`embed_height\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_generic_embed\` DROP COLUMN \`embed_height\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_generic_embed\` DROP COLUMN \`embed_height\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`footer_form_embed_height\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_generic_embed\` ADD \`embed_height\` numeric;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_generic_embed\` ADD \`embed_height\` numeric;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_generic_embed\` ADD \`embed_height\` numeric;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_generic_embed\` ADD \`embed_height\` numeric;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`footer_form_embed_height\` numeric;`)
}
