import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_link_preview_cards\` RENAME COLUMN "button_appearance" TO "button_variant";`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_link_preview_cards\` RENAME COLUMN "button_appearance" TO "button_variant";`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_link_preview_cards\` RENAME COLUMN "button_appearance" TO "button_variant";`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_link_preview_cards\` RENAME COLUMN "button_appearance" TO "button_variant";`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_link_preview_cards\` RENAME COLUMN "button_variant" TO "button_appearance";`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_link_preview_cards\` RENAME COLUMN "button_variant" TO "button_appearance";`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_link_preview_cards\` RENAME COLUMN "button_variant" TO "button_appearance";`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_link_preview_cards\` RENAME COLUMN "button_variant" TO "button_appearance";`,
  )
}
