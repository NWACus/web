import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_media_block\` ADD \`caption\` text;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_media_block\` ADD \`background_color\` text DEFAULT 'transparent';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_media_block\` ADD \`align_content\` text DEFAULT 'left';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_media_block\` ADD \`image_size\` text DEFAULT 'original';`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` ADD \`caption\` text;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` ADD \`background_color\` text DEFAULT 'transparent';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` ADD \`align_content\` text DEFAULT 'left';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` ADD \`image_size\` text DEFAULT 'original';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_media_block\` ADD \`caption\` text;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_media_block\` ADD \`background_color\` text DEFAULT 'transparent';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_media_block\` ADD \`align_content\` text DEFAULT 'left';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_media_block\` ADD \`image_size\` text DEFAULT 'original';`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_media_block\` ADD \`caption\` text;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_media_block\` ADD \`background_color\` text DEFAULT 'transparent';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_media_block\` ADD \`align_content\` text DEFAULT 'left';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_media_block\` ADD \`image_size\` text DEFAULT 'original';`,
  )
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`caption\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`caption\` text;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_media_block\` DROP COLUMN \`caption\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_media_block\` DROP COLUMN \`background_color\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_media_block\` DROP COLUMN \`align_content\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_media_block\` DROP COLUMN \`image_size\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` DROP COLUMN \`caption\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` DROP COLUMN \`background_color\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` DROP COLUMN \`align_content\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` DROP COLUMN \`image_size\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_media_block\` DROP COLUMN \`caption\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_media_block\` DROP COLUMN \`background_color\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_media_block\` DROP COLUMN \`align_content\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_media_block\` DROP COLUMN \`image_size\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_media_block\` DROP COLUMN \`caption\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_media_block\` DROP COLUMN \`background_color\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_media_block\` DROP COLUMN \`align_content\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_media_block\` DROP COLUMN \`image_size\`;`)
}
