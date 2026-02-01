import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_header_block\` ADD \`full_width_color\` integer DEFAULT true;`,
  )
  await db.run(
    sql`UPDATE \`home_pages_blocks_header_block\` SET \`full_width_color\` = CASE WHEN \`wrap_in_container\` = 0 THEN 1 ELSE 0 END;`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_header_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` ADD \`full_width_color\` integer DEFAULT true;`,
  )
  await db.run(
    sql`UPDATE \`_home_pages_v_blocks_header_block\` SET \`full_width_color\` = CASE WHEN \`wrap_in_container\` = 0 THEN 1 ELSE 0 END;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_header_block\` ADD \`full_width_color\` integer DEFAULT true;`,
  )
  await db.run(
    sql`UPDATE \`pages_blocks_header_block\` SET \`full_width_color\` = CASE WHEN \`wrap_in_container\` = 0 THEN 1 ELSE 0 END;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_header_block\` DROP COLUMN \`wrap_in_container\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_header_block\` ADD \`full_width_color\` integer DEFAULT true;`,
  )
  await db.run(
    sql`UPDATE \`_pages_v_blocks_header_block\` SET \`full_width_color\` = CASE WHEN \`wrap_in_container\` = 0 THEN 1 ELSE 0 END;`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_header_block\` DROP COLUMN \`wrap_in_container\`;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_document_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_document_block\` DROP COLUMN \`wrap_in_container\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_sponsors_block\` DROP COLUMN \`wrap_in_container\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` DROP COLUMN \`wrap_in_container\`;`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_document_block\` ADD \`wrap_in_container\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_header_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(
    sql`UPDATE \`home_pages_blocks_header_block\` SET \`wrap_in_container\` = CASE WHEN \`full_width_color\` = 0 THEN 1 ELSE 0 END;`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_header_block\` DROP COLUMN \`full_width_color\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` ADD \`wrap_in_container\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(
    sql`UPDATE \`_home_pages_v_blocks_header_block\` SET \`wrap_in_container\` = CASE WHEN \`full_width_color\` = 0 THEN 1 ELSE 0 END;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` DROP COLUMN \`full_width_color\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_document_block\` ADD \`wrap_in_container\` integer DEFAULT false;`,
  )

  await db.run(
    sql`ALTER TABLE \`pages_blocks_header_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(
    sql`UPDATE \`pages_blocks_header_block\` SET \`wrap_in_container\` = CASE WHEN \`full_width_color\` = 0 THEN 1 ELSE 0 END;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_header_block\` DROP COLUMN \`full_width_color\`;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_sponsors_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_block\` ADD \`wrap_in_container\` integer DEFAULT false;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_header_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
  await db.run(
    sql`UPDATE \`_pages_v_blocks_header_block\` SET \`wrap_in_container\` = CASE WHEN \`full_width_color\` = 0 THEN 1 ELSE 0 END;`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_header_block\` DROP COLUMN \`full_width_color\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` ADD \`wrap_in_container\` integer DEFAULT true;`,
  )
}
